<?php

namespace CoreBundle\Services;

use CoreBundle\Document\Page;
use CoreBundle\Libs\App;
use CoreBundle\Libs\Urlizer;
use CoreBundle\Libs\UtilString;
use Exception;
use DateTime;

class PdfService {

    const SERVICE = 'core.pdf.service';

    protected $file_paths;

    protected $endpoint;

    protected $user;

    protected $pass;

    const TIMEOUT = 20000;

    public function __construct($file_paths, $endpoint, $user, $pass)
    {
        $this->file_paths   = $file_paths;

        $this->endpoint     = $endpoint;

        $this->user         = $user;

        $this->pass         = $pass;

        if (!$user) {

            throw new Exception("endpiont: user is empty");
        }

        if (!$pass) {

            throw new Exception("endpiont: pass is empty");
        }

        if (!$endpoint) {

            throw new Exception("endpiont: Given url is false");
        }

        if (!preg_match('#^https?://.*#', $endpoint)) {

            throw new Exception("endpiont: Invalid url: $endpoint");
        }
    }
    public function generatePdfTemplateUrlForPage(Page $page, $route = 'pdf_render') {

        $host = $_SERVER['REQUEST_SCHEME'] . '://' . $_SERVER['HTTP_HOST'];

        $url = $host . App::getRouter()->generate($route, array(
            'id' => urlencode($page->getId())
        ));

        return $url;
    }

    /**
     * @param Page $page
     * @param bool $fresh - force to generate fresh pdf
     * @return null|string
     * @throws Exception
     */
    public function downloadPdfBasedOnPage(Page $page, $fresh = false) {

        $pdf            = $page->getPdf();

        $pdfRefreshed   = $page->getPdfRefreshed();

        $updatedAt      = $page->getUpdatedAt();

        $realPdf        = null;

        $generated  = $this->generateUploadPaths('');

        if ($pdf) {

            $realPdf    = $generated['real'] . DIRECTORY_SEPARATOR . $pdf;
        }

//        var_dump(array(
//            '$pdf' => $pdf
//        ));
//
//        var_dump(array(
//            'file_exists($realPdf)' => file_exists($realPdf)
//        ));
//
//        var_dump(array(
//            '$pdfRefreshed' => $pdfRefreshed
//        ));
//
//        var_dump(array(
//            '$updatedAt' => $updatedAt
//        ));
//
//        var_dump(array(
//            '$pdfRefreshed > $updatedAt' => $pdfRefreshed >= $updatedAt
//        ));
//
//        die('end');

        if (!$fresh && $pdf && file_exists($realPdf) && $pdfRefreshed && $updatedAt && $pdfRefreshed >= $updatedAt) {

            return $generated['web'] . DIRECTORY_SEPARATOR . $pdf;
        }
        else {

            $url    = $this->generatePdfTemplateUrlForPage($page) . '?real';

            $data   = $this->downloadPdfBasedOnUrl($url, $page->getPdf(), array(
                'title' => $page->getTitle()
            ));

            if (empty($data['db'])) {

                throw new Exception("Wrong data returned from downloadPdfBasedOnUrl for url: '$url'");
            }
            else {

                $page->setPdf($data['db']);

                $page->setPdfRefreshed(new DateTime());

                return $generated['web'] . DIRECTORY_SEPARATOR . $data['db'];
            }
        }

        return $realPdf;
    }
    public function downloadPdfBasedOnUrl(string $url, $suggestedTargetLocation = null, $extra = array())
    {
        if (!$url) {

            throw new Exception("Given url is false");
        }

        if (!preg_match('#^https?://.*#', $url)) {

            throw new Exception("Invalid url: $url");
        }

        // due to update
        if (strpos($suggestedTargetLocation, '/252fcms-252fpages-252fnews-252f') !== false) {

            $suggestedTargetLocation = null;
        }

        if ( $suggestedTargetLocation ) {

            $generated = $this->generateUploadPaths('');

//            Array
//            (
//                [md5] => f16f786fc806eb2c931ee5a434dbda7d
//                [path] => Array
//                (
//                    [0] => f1
//                    [1] => 6f
//                )
//                [relativeDirectory] => 7e/21
//                [absoluteDirectory] => /var/www/hub/current/app/../web/volatile_media/pdfs/7e/21
//                [real] => /var/www/hub/current/app/../web/volatile_media/pdfs
//                [web] => /volatile_media/pdfs
//            )



            $return['real']     = $generated['real'] . DIRECTORY_SEPARATOR . $suggestedTargetLocation;

            $return['db']       = $suggestedTargetLocation;
        }
        else {

            if (empty($extra['title'])) {

                $name = Urlizer::urlizeTrim(parse_url($url)['path']) . '.pdf';
            }
            else {

                $name = Urlizer::urlizeTrim($extra['title']) . '.pdf';
            }

            do {

                $generated = $this->generateUploadPaths($name);

                $realPath = $generated['absoluteDirectory'] . DIRECTORY_SEPARATOR . $name;

            } while (file_exists($realPath));

            $return['real']     = $generated['absoluteDirectory'] . DIRECTORY_SEPARATOR . $name;

            $return['db']       = $generated['relativeDirectory'] . DIRECTORY_SEPARATOR . $name;
        }


        $dir = dirname($return['real']);

        @mkdir($dir, $mode = 0777, $recursive = true);

        if ( ! file_exists($dir)) {

            throw new Exception("Can't create directory '$dir'");
        }

        if (file_exists($return['real'])) {

            @unlink($return['real']);
        }

        if (file_exists($return['real'])) {

            throw new Exception("Can't remove file '{$return['real']}'");
        }

        $ch             = curl_init();

        curl_setopt($ch, CURLOPT_ENCODING, '');

        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'POST');

        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, static::TIMEOUT);

//        $call = $this->endpoint . '?' . http_build_query(array(
//            'url' => $url
//        ));

        curl_setopt($ch, CURLOPT_URL, $this->endpoint);

        $data = array(
            'url' => $url,
            'pdf' => array(
                //"displayHeaderFooter" => true,
                "format" => 'A4',
                "margin" => array(
                    "top" => '0',
                    "right" => '0',
                    "bottom" => '0',
                    "left" => '0',
                ),
                'scale' => 0.7
            )
        );

        if (!is_string($data) && $data) {
            $data = json_encode($data);
        }

        if ($data) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
        }


        curl_setopt($ch, CURLOPT_HEADER, 1);

        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);

        curl_setopt($ch, CURLOPT_USERPWD, $this->user . ":" . $this->pass);

        $response       = null;

        $response       = curl_exec($ch);

        $header_size    = curl_getinfo($ch, CURLINFO_HEADER_SIZE);

        $header         = substr($response, 0, $header_size);

        $body           = substr($response, $header_size);

        $status         = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        if ( $status == 401) {

            curl_close($ch);

            throw new Exception("Bad basic auth credentials");
        }

        if ( $status != 200 ) {

            curl_close($ch);

            throw new Exception("Invalid curl status code for url: $url, status code is: '$status'\nbody:\n$body\nheaders:\n$header\n\n");
        }

        $contentType    = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);

        if ( $contentType !== 'application/pdf' ) {

            throw new Exception("Wrong Content-type: '$contentType'");
        }

        curl_close($ch);

        file_put_contents($return['real'], $body, FILE_APPEND);

        return $return;
    }

    protected function generateUploadPaths($originalName = null) {

        $md5 = md5(time().uniqid());

        $path = str_split(substr($md5, 0, 4), 2);

        $relativeDirectory = implode(DIRECTORY_SEPARATOR, str_split(substr(md5(time().uniqid()), 0, 4), 2));

        $absoluteDirectory = $this->file_paths['real'] . DIRECTORY_SEPARATOR . $relativeDirectory;

        $data = array_merge(array(
            'md5'                   => $md5,
            'path'                  => $path,
            'relativeDirectory'     => $relativeDirectory,
            'absoluteDirectory'     => $absoluteDirectory
        ), $this->file_paths);

        if ($originalName) {

            $data['proposed'] = $data['absoluteDirectory'] . DIRECTORY_SEPARATOR . $originalName;
        }

        return $data;
    }
}