<?php

function scrapeLog($message)
{
	@mkdir(__DIR__ . "/log");
	file_put_contents(__DIR__ . "/log/scrape.log",date("Y-m-d H:i:s") . " - " . $message . "\n",FILE_APPEND);
	error_log($message);
}

function file_get_contents_cached($url, $encoded, $timeout = 1087000)
{
	global $baseUrl;
	$md5OfUrl = md5($url);
	$md5CacheDir = substr($md5OfUrl,0,3);

	$baseDir = str_replace(['https://','http://'],'',$baseUrl);
	$baseDir = str_replace('/', '_', $baseDir);

	@mkdir(__DIR__ . "/cachedir/" . $baseDir);
	@mkdir(__DIR__ . "/cachedir/" . $baseDir . "/" . $md5CacheDir);

	$fileName = __DIR__ . "/cachedir/". $baseDir . "/" . $md5CacheDir . "/" . $md5OfUrl ;

	if (fileTimeIsValid($fileName,$timeout))
		return file_get_contents($fileName);
	else
	{
    $ch = curl_init();

    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_HEADER, 0);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt( $ch, CURLOPT_USERAGENT, "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.109 Safari/537.36" );
    $data = curl_exec($ch);

    curl_close ($ch);

    if (strlen($data)>10)
    {
      $data = str_replace('UTF-7', 'UTF-8', $data);
      @file_put_contents($fileName,$data);
      return $data;
    }

		$data = @file_get_contents($url);

		if($encoded)
		{
			$encodedHtml = json_decode($data);
			$data = $encodedHtml->llContentContainerHtml;
		}

		if (strlen($data)>10)
		{
			$data = str_replace('UTF-7', 'UTF-8', $data);
			@file_put_contents($fileName,$data);
			return $data;
		}
		else
			return false;

		//print "\ndata is empty\n";
	}
}

function getXpathWithDom($url, $encoded = false)
{
	$pageData = file_get_contents_cached(trim($url), $encoded);

	if($pageData){
		$pageDom = new \DOMDocument();
		$pageDom->loadHTML($pageData);
		$pageXpath = new \DomXPath($pageDom);

		return $pageXpath;
	}
}

function file_get_contents_cached_ajax($url, $encoded,$context,$page, $timeout = 1087000)
{
	global $baseUrl;
	$md5OfUrl = md5($url);
	$md5CacheDir = substr($md5OfUrl,0,3).$page;

	$baseDir = str_replace(['https://','http://'],'',$baseUrl);
	$baseDir = str_replace('/', '_', $baseDir);

	@mkdir(__DIR__ . "/cachedir/" . $baseDir);
	@mkdir(__DIR__ . "/cachedir/" . $baseDir . "/" . $md5CacheDir);

	$fileName = __DIR__ . "/cachedir/". $baseDir . "/" . $md5CacheDir . "/" . $md5OfUrl ;

	if (fileTimeIsValid($fileName,$timeout))
		return file_get_contents($url,$encoded,$context);
	else
	{
		$data = file_get_contents($url,$encoded,$context);

		if (strlen($data)>10)
		{
			@file_put_contents($fileName,$data);
			return $data;
		}
		else
			return false;
	}
}

function getAjaxXpathWithDom($url, $encoded,$context,$page)
{
	$pageData = file_get_contents_cached_ajax($url, $encoded,$context,$page);

	if($pageData){
		$pageDom = new \DOMDocument();
		$pageDom->loadHTML($pageData);
		$pageXpath = new \DomXPath($pageDom);

		return $pageXpath;
	}
}

function fileTimeIsValid($fileName,$timeout)
{
	//Check if file already exists
	if (file_exists($fileName))
	{
		//Check if size if above 0
		if (filesize($fileName)>0)
		{
			if (filemtime($fileName) > time()-$timeout)
			{
				return true;
			}
			else return false;
		}
		else return false;
	}
	else return false;
}

function getPageData($baseUrl)
{
	$baseUrl = str_replace(['https://','http://'],'',$baseUrl);
	$baseUrl = str_replace('/','_',$baseUrl);
 	$sitedata = @file_get_contents(__DIR__ . "/siteData/".$baseUrl);
	return json_decode($sitedata, true);
}

function setPageData($baseUrl, $siteArray)
{
	@mkdir(__DIR__ . "/siteData/");

	$siteArray = json_encode($siteArray);
	$baseUrl = str_replace(['https://','http://'],'',$baseUrl);
	$baseUrl = str_replace('/','_',$baseUrl);
	file_put_contents(__DIR__ . "/siteData/".$baseUrl, $siteArray);
}

function sendAgentsData($envVars, $payload, $payloadLength = 10)
{
	$api = new Sdk(Config::create($envVars['app_key'], $envVars['app_secret'], $envVars['base_url']));
	$prev = array();

	$segments = ceil(count($payload) / $payloadLength);

	for ($i = 0; $i < $segments; $i++) {

		$segmentedPayload = array_slice($payload, $i * $payloadLength, $payloadLength);
	    $response = $api->request(RequestBuilder::build(RequestBuilder::AGENT_CREATE_UPDATE, $segmentedPayload));

		echo PHP_EOL . 'Creating / Updating agents response: ' . PHP_EOL;

		print_r($response);
		echo PHP_EOL;

		if (!empty($response->general_failure))
			break;

	}
}

function isScanned($blog_url,$envVars)
{
	if (!isset($envVars['DOMAIN'])) die("\n\n\nenvVars not set!\n\n\n");
	if (!isset($blog_url)) die("pblog_url is empty, this should be checked in upper code\n");
	if (!is_string($blog_url)) die("pblog_url is not a string, this should be checked in upper code\n");
	if (strlen($blog_url) < 5) die("pblog_url below 5 chars, this should be checked in upper code\n");

	$file = __DIR__ . "/siteData/" . trim($envVars['DOMAIN']) . ".ser";

	if (file_exists($file))
	{
		$domainSettings = getSerializedSettings($file);
		if (isset($domainSettings['urls'][$blog_url])) return true;
		else return false;
	}
	else
	{
		$domainSettings = getSerializedSettings($file);
		setSerializedSettings($file,$domainSettings);
		// die("Please rerun script...");
	}
}

function getSerializedSettings($file)
{
	if (file_exists($file))
		return unserialize(file_get_contents($file));
	else
	{
		$arr['start'] = date("Y-m-d H:i:s");
		return $arr;
	}
}
function setSerializedSettings($file,$domainSettings)
{
	file_put_contents($file,serialize($domainSettings));
}

function transliterateString($txt) {
    $transliterationTable = array('á' => 'a', 'Á' => 'A', 'à' => 'a', 'À' => 'A', 'ă' => 'a', 'Ă' => 'A', 'â' => 'a', 'Â' => 'A', 'å' => 'a', 'Å' => 'A', 'ã' => 'a', 'Ã' => 'A', 'ą' => 'a', 'Ą' => 'A', 'ā' => 'a', 'Ā' => 'A', 'ä' => 'ae', 'Ä' => 'AE', 'æ' => 'ae', 'Æ' => 'AE', 'ḃ' => 'b', 'Ḃ' => 'B', 'ć' => 'c', 'Ć' => 'C', 'ĉ' => 'c', 'Ĉ' => 'C', 'č' => 'c', 'Č' => 'C', 'ċ' => 'c', 'Ċ' => 'C', 'ç' => 'c', 'Ç' => 'C', 'ď' => 'd', 'Ď' => 'D', 'ḋ' => 'd', 'Ḋ' => 'D', 'đ' => 'd', 'Đ' => 'D', 'ð' => 'dh', 'Ð' => 'Dh', 'é' => 'e', 'É' => 'E', 'è' => 'e', 'È' => 'E', 'ĕ' => 'e', 'Ĕ' => 'E', 'ê' => 'e', 'Ê' => 'E', 'ě' => 'e', 'Ě' => 'E', 'ë' => 'e', 'Ë' => 'E', 'ė' => 'e', 'Ė' => 'E', 'ę' => 'e', 'Ę' => 'E', 'ē' => 'e', 'Ē' => 'E', 'ḟ' => 'f', 'Ḟ' => 'F', 'ƒ' => 'f', 'Ƒ' => 'F', 'ğ' => 'g', 'Ğ' => 'G', 'ĝ' => 'g', 'Ĝ' => 'G', 'ġ' => 'g', 'Ġ' => 'G', 'ģ' => 'g', 'Ģ' => 'G', 'ĥ' => 'h', 'Ĥ' => 'H', 'ħ' => 'h', 'Ħ' => 'H', 'í' => 'i', 'Í' => 'I', 'ì' => 'i', 'Ì' => 'I', 'î' => 'i', 'Î' => 'I', 'ï' => 'i', 'Ï' => 'I', 'ĩ' => 'i', 'Ĩ' => 'I', 'į' => 'i', 'Į' => 'I', 'ī' => 'i', 'Ī' => 'I', 'ĵ' => 'j', 'Ĵ' => 'J', 'ķ' => 'k', 'Ķ' => 'K', 'ĺ' => 'l', 'Ĺ' => 'L', 'ľ' => 'l', 'Ľ' => 'L', 'ļ' => 'l', 'Ļ' => 'L', 'ł' => 'l', 'Ł' => 'L', 'ṁ' => 'm', 'Ṁ' => 'M', 'ń' => 'n', 'Ń' => 'N', 'ň' => 'n', 'Ň' => 'N', 'ñ' => 'n', 'Ñ' => 'N', 'ņ' => 'n', 'Ņ' => 'N', 'ó' => 'o', 'Ó' => 'O', 'ò' => 'o', 'Ò' => 'O', 'ô' => 'o', 'Ô' => 'O', 'ő' => 'o', 'Ő' => 'O', 'õ' => 'o', 'Õ' => 'O', 'ø' => 'oe', 'Ø' => 'OE', 'ō' => 'o', 'Ō' => 'O', 'ơ' => 'o', 'Ơ' => 'O', 'ö' => 'oe', 'Ö' => 'OE', 'ṗ' => 'p', 'Ṗ' => 'P', 'ŕ' => 'r', 'Ŕ' => 'R', 'ř' => 'r', 'Ř' => 'R', 'ŗ' => 'r', 'Ŗ' => 'R', 'ś' => 's', 'Ś' => 'S', 'ŝ' => 's', 'Ŝ' => 'S', 'š' => 's', 'Š' => 'S', 'ṡ' => 's', 'Ṡ' => 'S', 'ş' => 's', 'Ş' => 'S', 'ș' => 's', 'Ș' => 'S', 'ß' => 'SS', 'ť' => 't', 'Ť' => 'T', 'ṫ' => 't', 'Ṫ' => 'T', 'ţ' => 't', 'Ţ' => 'T', 'ț' => 't', 'Ț' => 'T', 'ŧ' => 't', 'Ŧ' => 'T', 'ú' => 'u', 'Ú' => 'U', 'ù' => 'u', 'Ù' => 'U', 'ŭ' => 'u', 'Ŭ' => 'U', 'û' => 'u', 'Û' => 'U', 'ů' => 'u', 'Ů' => 'U', 'ű' => 'u', 'Ű' => 'U', 'ũ' => 'u', 'Ũ' => 'U', 'ų' => 'u', 'Ų' => 'U', 'ū' => 'u', 'Ū' => 'U', 'ư' => 'u', 'Ư' => 'U', 'ü' => 'ue', 'Ü' => 'UE', 'ẃ' => 'w', 'Ẃ' => 'W', 'ẁ' => 'w', 'Ẁ' => 'W', 'ŵ' => 'w', 'Ŵ' => 'W', 'ẅ' => 'w', 'Ẅ' => 'W', 'ý' => 'y', 'Ý' => 'Y', 'ỳ' => 'y', 'Ỳ' => 'Y', 'ŷ' => 'y', 'Ŷ' => 'Y', 'ÿ' => 'y', 'Ÿ' => 'Y', 'ź' => 'z', 'Ź' => 'Z', 'ž' => 'z', 'Ž' => 'Z', 'ż' => 'z', 'Ż' => 'Z', 'þ' => 'th', 'Þ' => 'Th', 'µ' => 'u', 'а' => 'a', 'А' => 'a', 'б' => 'b', 'Б' => 'b', 'в' => 'v', 'В' => 'v', 'г' => 'g', 'Г' => 'g', 'д' => 'd', 'Д' => 'd', 'е' => 'e', 'Е' => 'E', 'ё' => 'e', 'Ё' => 'E', 'ж' => 'zh', 'Ж' => 'zh', 'з' => 'z', 'З' => 'z', 'и' => 'i', 'И' => 'i', 'й' => 'j', 'Й' => 'j', 'к' => 'k', 'К' => 'k', 'л' => 'l', 'Л' => 'l', 'м' => 'm', 'М' => 'm', 'н' => 'n', 'Н' => 'n', 'о' => 'o', 'О' => 'o', 'п' => 'p', 'П' => 'p', 'р' => 'r', 'Р' => 'r', 'с' => 's', 'С' => 's', 'т' => 't', 'Т' => 't', 'у' => 'u', 'У' => 'u', 'ф' => 'f', 'Ф' => 'f', 'х' => 'h', 'Х' => 'h', 'ц' => 'c', 'Ц' => 'c', 'ч' => 'ch', 'Ч' => 'ch', 'ш' => 'sh', 'Ш' => 'sh', 'щ' => 'sch', 'Щ' => 'sch', 'ъ' => '', 'Ъ' => '', 'ы' => 'y', 'Ы' => 'y', 'ь' => '', 'Ь' => '', 'э' => 'e', 'Э' => 'e', 'ю' => 'ju', 'Ю' => 'ju', 'я' => 'ja', 'Я' => 'ja','°' =>'','´' => '' );
    return str_replace(array_keys($transliterationTable), array_values($transliterationTable), $txt);
}

function get_inner_html( $node ) {
    $innerHTML= '';
    $children = $node->childNodes;
    foreach ($children as $child) {
        $innerHTML .= $child->ownerDocument->saveXML( $child );
    }

    return $innerHTML;
}

function postData($endPoint, $postData)
{
    $postData = http_build_query($postData);
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL,$endPoint);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

    $server_output = curl_exec($ch);

    curl_close ($ch);

}
