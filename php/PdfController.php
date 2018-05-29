<?php

namespace CoreBundle\Controller;

use CoreBundle\Document\PageManager;
use CoreBundle\Dumpers\MainDumper;
use CoreBundle\Libs\App;
use CoreBundle\Libs\Lock;
use CoreBundle\Libs\Request;
use CoreBundle\Services\PdfService;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Response;

/**
 *
 * url to pdf generator mechanizm: (this url always should be exposed in json feeds)
 * http://hub.vagrant8/app_dev.php/pdf/download/%252Fcms%252Fpages%252Fnews%252Fvenetoclax-potential-for-relapsed-cll-patients-who-progressed-after-bcri-therapies
 *          NOTICE: must be encodeURIComponent'ed twice
 *          on backend it is good to use method  PdfService::generatePdfTemplateUrlForPage
 *
 * http://hub.vagrant8/app_dev.php/pdf/render/%252Fcms%252Fpages%252Fnews%252Fvenetoclax-potential-for-relapsed-cll-patients-who-progressed-after-bcri-therapies
 *      render endpoint
 *
 * final pdf url:
 *      http://hub.vagrant8/volatile_media/pdfs/a2/5f/app-dev-php-pdf-render-252fcms-252fpages-252fnews-252fvenetoclax-potential-for-relapsed-cll-patients-who-progressed-after-bcri-therapies.pdf
 *
 * For local development it might be necessary to use local version of puppeteer pdf generator
 *      pdf_microservice_endpoint   : "http://192.168.100.120:7777/generate"
 *
 * For testing add ?fresh get parameter:
 *      http://hub.vagrant8/app_dev.php/pdf/download/%252Fcms%252Fpages%252Fnews%252Fassist-prof-emmanuel-bachy-ash-2017-key-findings-in-lymphoma-biology-at-ash-2017?fresh
 *
 */
class PdfController extends AbstractController
{
    public function downloadAction(Request $request, $id) {

        $lock = new Lock(App::getRootDir() . '/web/volatile_media/lock');

        $lock->lock();
        
        $id = urldecode($id);

        $service = $this->get(PageManager::SERVICE);

        $page = $service->find(null, $id);

        if ( ! $page ) {

            $lock->unlock();

            throw $this->createNotFoundException(sprintf('Page %s not found', $id));
        }

        /* @var $pdfservice PdfService */
        $pdfservice = $this->get(PdfService::SERVICE);

        $real = $pdfservice->downloadPdfBasedOnPage($page, $request->query->has('fresh'));

        $service->update($page);

        if ($real) {

            header('Content-Type: application/pdf');

            header('Content-Disposition: attachment; filename="'.pathinfo($real, PATHINFO_BASENAME).'"');

            header('Expires: 0');
            header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
            header('Pragma: public');

            header('Content-Length: '.filesize($real));

            readfile($real);

            $lock->unlock();

            exit;
        }

        $lock->unlock();
        
        die('Generating file failed...');
    }
    public function renderAction(Request $request, $id) {

        $id = urldecode($id);

        $service = $this->get(PageManager::SERVICE);

        $page = $service->find(null, $id);

        if ( ! $page ) {

            return new Response("Article '$id' doesn't exist", 404);
        }

        $data = MainDumper::getInstance()->dump($page);

        /* @var $pdfservice PdfService */
        $pdfservice = $this->get(PdfService::SERVICE);

        return $this->render("CoreBundle:Pdf:render.html.twig", array(
            'page' => $data,
            'host' => $_SERVER['REQUEST_SCHEME'] . '://' . $_SERVER['HTTP_HOST'],
            'real' => $request->query->has('real'),
            'test' => $pdfservice->generatePdfTemplateUrlForPage($page, 'pdf_download') . '?fresh',
            'json' => str_replace('<', '&lt;', json_encode($data, JSON_PRETTY_PRINT))
        ));
    }
}
