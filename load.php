<?php
    $opts = [
        "http" => [
            "method" => "GET",
            "header" => "Accept-language: cs\r\n"
        ]
    ];
    $context = stream_context_create($opts);

    if(isset($_POST)) {
        if(isset($_POST["a"]) && isset($_POST["b"]) && isset($_POST["c"]) && isset($_POST["d"]) && isset($_POST["e"])) {
            if($_POST["a"] === "s") {
                echo file_get_contents("https://www.fit.vut.cz/study/programs/", false, $context);
            } else if($_POST["a"] === "u") {
                if(ctype_alnum($_POST["b"]) && is_numeric($_POST["c"]) && ctype_alnum($_POST["d"]) && ctype_alnum($_POST["e"])) {
                    echo json_encode(array(
                        "a" => file_get_contents("https://www.fit.vut.cz/study/" . urlencode($_POST["b"]) . "/" . intval($_POST["c"]), false, $context),
                        "d" => urlencode($_POST["d"]) . "-" . urlencode($_POST["e"])
                    ));
                }
            }
        }
    }

    echo "";
?>
