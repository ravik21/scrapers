<?php

@mkdir("../../cachedir/");
include(__DIR__ . "/../../scrapeFunctions.php");
// require_once(__DIR__ . "/../../config.php");

libxml_use_internal_errors(true);
$apiUrl = 'http://voyage-trends.co/v1/api';
$baseUrl = "http://www.wanderingsarah.com";
$payloadLength = 6;
$pages = [];
$blogs = [];

getLocationsUrls($baseUrl);
//createAgents();

function getLocationsUrls($baseUrl)
{
    $locationsWithBlog = [];

    // Create a new XPath object
    $url = $baseUrl.'/new-blog';

    $i = 0;

    while (1) {
      $xpath = getXpathWithDom($url);
      echo "Processing URL: ". $url .PHP_EOL;

      $nodes = $xpath->query('//nav[contains(@class,"pagination")]');

      if(!$nodes->length) {
        break;
      }

      $node = $nodes[0];
      $locationNode = $node->getElementsByTagName('div');

      if( $i > 0 && $locationNode->length < 2) {
        break;
      }

      if($locationNode->length == 2) {
        $locationNode = $locationNode->item(1);
      } else {
        $locationNode = $locationNode->item(0);
      }

      $locationNode = $locationNode->getElementsByTagName('a')->item(0);

      $url = $baseUrl.$locationNode->getAttribute('href');
      $name = $locationNode->textContent;

      $location = ['name'=> $name , 'url' => $url];
      $locationsWithBlog[] = $location;
      $i++;
      getLocationBlogUrls($location);
    }
}

function getLocationBlogUrls($locationsWithBlog)
{
    global $blogs, $baseUrl;
    $url = $locationsWithBlog['url'];
    $locationXpath = getXpathWithDom($url);
    echo "Processing Location List URL:<br> ". $url .PHP_EOL;
    $titles = $locationXpath->query('//article//header//h1');

    foreach ($titles as $key => $title) {
      if($locationXpath->query('//article//div[contains(@class,"excerpt-thumb")]//a')->item($key)) {
        $title = $locationXpath->query('//article//header//h1')->item($key)->textContent;
        $mainImage = $locationXpath->query('//article//div[contains(@class,"excerpt-thumb")]//img')->item($key)->getAttribute('data-src');
        $description = $locationXpath->query('//article//div[contains(@class,"p-summary")]//p')->item($key)->textContent;
        $url = $baseUrl . $locationXpath->query('//article//div[contains(@class,"excerpt-thumb")]//a')->item($key)->getAttribute('href');

        $mainImage = explode('?', $mainImage);
        $blogs[] = ['url' => $url, 'main_mage' => $mainImage[0], 'description' => $description, 'title' => $title];
      }
    }
}

print "Start\n";
$blogUrls = [];

if (is_array($blogs)) {
	print "Get blogs Url";
	//print_r($propertyUrls);
    $blog = getPropertyDetailData($blogs);
    // sendData($properties);
}

function getPropertyDetailData($blogs)
{
      global $payloadLength;

      foreach($blogs as $key => $blog) {
        $blogDetailUrl = $blog['url'];
        $envVars = 'production';
        $blogs = getBlogData($blog);
     }
}

function getBlogData($blog)
{
    global $apiUrl;
    $content = '';
    $propertyUrlContents = str_replace(['https://','http://'], '', $blog['url']);
    $propertyDetailXpath = getXpathWithDom($blog['url']);
    echo  "Processing Blog Detail URL: ". $blog['url'] .PHP_EOL;

    $propertyDetail = $propertyDetailXpath->query('//article');
    if ($propertyDetail->length)
    {
      $propertyDetail = $propertyDetail[0];

      $title = $propertyDetail->getElementsByTagName('header')->item(0)->getElementsByTagName('h1')->item(0)->textContent;
      $contentNodes = $propertyDetailXpath->query('//article//div[contains(@class,"sqs-block-content")]');

      foreach ($contentNodes as $key => $contentNode) {
        if($contentNode->getElementsByTagName('img')->length) {
          for ($i=0; $i < $contentNode->getElementsByTagName('img')->length; $i++) {
            if($contentNode->getElementsByTagName('img')->item($i)->getAttribute('data-src')) {
              $content .= '<p><img src="'.$contentNode->getElementsByTagName('img')->item($i)->getAttribute('data-src').'" style="padding:30px;"></p>';
            }
          }
        }

        if($contentNode->getElementsByTagName('p')->length) {
          for ($i=0; $i < $contentNode->getElementsByTagName('p')->length; $i++) {
            $content .= '<p>'.get_inner_html($contentNode->getElementsByTagName('p')->item($i)).'</p>';
          }
        }
      }

      $data = [
        'title'      => trim(preg_replace('!\s+!', ' ', $title)),
        'content'    => $content,
        'meta_title' => trim(preg_replace('!\s+!', ' ', $title)),
        'meta_description' => $blog['description'],
        'description' => $blog['description'],
        'user_id'    => 1,
        'main_image' => $blog['main_mage']
      ];

      $endPoint = $apiUrl .'/post/store';
      postData($endPoint, $data);
      echo PHP_EOL;
    }
}
