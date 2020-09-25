<?php
    header("Content-Type: text/html; charset=UTF-8");

    $opts = [
        "http" => [
            "method" => "GET",
            "header" => "Accept-language: cs\r\n"
        ]
    ];
    $context = stream_context_create($opts);

    if(isset($_POST)) {
        if(isset($_POST["a"]) && isset($_POST["b"])) {
            if($_POST["a"] === "a") {
                if($_POST["b"] === "a") {
                    echo json_encode(array("a" => "a", "b" => file_get_contents("https://www.fit.vut.cz/study/program/18/", false, $context)));       // New
                } else {                    
                    echo json_encode(array("a" => "b", "b" => file_get_contents("https://www.fit.vut.cz/study/field/1/?plan=264", false, $context))); // Old
                }
            } else if($_POST["a"] === "b") {
                if(is_numeric($_POST["b"])) {
                    echo file_get_contents("https://www.fit.vut.cz/study/course/" . intval($_POST["b"]), false, $context);    
                }                
            } 
        }
    }
    echo "";
?>
