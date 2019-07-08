<?php

@mkdir("../../cachedir/");
include(__DIR__ . "/../../scrapeFunctions.php");
// require_once(__DIR__ . "/../../config.php");

libxml_use_internal_errors(true);
$apiUrl = 'http://voyage-trends.co/v1/api';
$baseUrl = "https://intothewild-blog.com";
$payloadLength = 6;
$pages = [];
$blogs = [];

getLocationsUrls($baseUrl);
//createAgents();

function getLocationsUrls($baseUrl)
{
    $locationsWithBlog = [];
    // Create a new XPath object
    $xpath = getXpathWithDom($baseUrl);
    echo "Processing Base URL:<br> ". $baseUrl .PHP_EOL . "<br> <br>";

    // Query all  nodes containing specified class name
    $nodes = $xpath->query('//ul[contains(@class,"sub-menu")]');

    $node = $nodes[0];
    //For getting Locations
    // foreach ($nodes as $key => $node) {
        $locations = $node->getElementsByTagName('a');
        foreach ($locations as $key => $location) {
          $url = $location->getAttribute('href');
          $name = $location->textContent;
          $location = ['name'=> $name , 'url' => $url];
          getLocationBlogUrls($location, $baseUrl, $key);
          $locationsWithBlog[] = $location;
        }

        // print_R($locationsWithBlog);die;
    // }

    // return $locationUrls;
}

function getLocationBlogUrls($locationsWithBlog, $baseUrl, $locationKey)
{
    global $blogs;
    $url = $locationsWithBlog['url'];
    $locationXpath = getXpathWithDom($url);
    echo "Processing Location List URL:<br> ". $url .PHP_EOL . "<br> <br>";
    $blogNodes = $locationXpath->query('//div[contains(@class,"wp-caption aligncenter")]');

    foreach ($blogNodes as $key => $blogNode) {
      $blogDetailNode = $blogNode->getElementsByTagName('p')->item(0)->getElementsByTagName('a');
      if($blogDetailNode->length) {
        $url = $blogDetailNode->item(0)->getAttribute('href');
        $name = $blogDetailNode->item(0)->textContent;
        $mainImage = $blogNode->getElementsByTagName('a')->item(0)->getElementsByTagName('img')->item(0)->getAttribute('src');
        $mainImage = explode('?', $mainImage);
        $blogs[] = ['name' => $name, 'url' => $url, 'main_mage' => $mainImage[0]];
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
      $contentNodes = $propertyDetailXpath->query('//article//div[contains(@class,"entry-content")] //p');

      foreach ($contentNodes as $key => $contentNode) {
        $content .= '<p>'.get_inner_html($contentNode).'</p>';
      }

      $data = [
        'title'      => $title,
        'content'    => $content,
        'user_id'    => 4,
        'main_image' => $blog['main_mage']
      ];

      $endPoint = $apiUrl .'/post/store';
      postData($endPoint, $data);
      echo PHP_EOL;
    }
}
