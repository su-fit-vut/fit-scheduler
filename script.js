var newPlanYear = 2019;                                                         // První rok nového plánu

var actWorkingSubjectIndex = 0;                                                 // Aktuálně parsovaný předmět
var subjectsAll = [[[[], []],[[], []],[[], []]],[[[], []],[[], []],[[], []]]];  // List předmětů
var subjectsWorking = [];                                                       // Vybrané předměty

var scheduleAll = [[], [], [], [], []];                                         // Pole pracovního rozvrhu
var scheduleFin = [[], [], [], [], []];                                         // Pole výsledného rozvrhu
var scheduleAllLayersCount = [0, 0, 0, 0, 0];                                   // Počet vrstev v pracovním rozvrhu
var scheduleFinLayersCount = [0, 0, 0, 0, 0];                                   // POčet vrstev ve výsledném rozvrhu

var scheduleCustom = [[], [], [], [], []];                                      // Pole vlastních hodin
var scheduleIndexes = [];                                                       // Indexy vybraných hodin
var scheduleFaded = [];                                                         // Potmavené hodiny















/////////////////////////////////// Variables //////////////////////////////////
var studies = []; // Array of loaded studies




///////////////////////////////////// Main /////////////////////////////////////
$(document).ready(function() {
    // Semester radio auto select
    var d = new Date();
    if(d.getMonth() === 11 || d.getMonth() < 4) {
        $(".sem_radio[value='1']").prop("checked", true);
    } else {
        $(".sem_radio[value='0']").prop("checked", true);
    }

    // Start menu load
    loadStudies();
});

//////////////////////////////////// Events ////////////////////////////////////
// Header
$(document).on("click", ".header_menu_icon", function() {
    $(".header_menu_icon").addClass("hidden");
    $(".header_info_icon").addClass("hidden");
    $(".header_cross_icon").removeClass("hidden");

    $(".menu").removeClass("hidden");
    $(".info").addClass("hidden");
});
$(document).on("click", ".header_info_icon", function() {
    $(".header_menu_icon").addClass("hidden");
    $(".header_info_icon").addClass("hidden");
    $(".header_cross_icon").removeClass("hidden");

    $(".menu").addClass("hidden");
    $(".info").removeClass("hidden");
});
$(document).on("click", ".header_cross_icon", function() {
    $(".header_menu_icon").removeClass("hidden");
    $(".header_info_icon").removeClass("hidden");
    $(".header_cross_icon").addClass("hidden");

    $(".menu").addClass("hidden");
    $(".info").addClass("hidden");
});

// Menu
$(document).on("click", ".menu_sem_radio", function() {
    renderSubjects();
});
$(document).on("click", ".menu_bit_checkbox", function() {
    renderSubjects();
});
$(document).on("click", ".menu_mit_radio", function() {
    if($(this).hasClass("mit_radio_checked")) {
        $(".menu_mit_radio").removeClass("mit_radio_checked");
        $(this).prop("checked", false);
    } else {
        $(".menu_mit_radio").removeClass("mit_radio_checked");
        $(this).addClass("mit_radio_checked");
    }

    renderSubjects();
});
$(document).on("click", ".menu_grade_checkbox", function() {
    renderSubjects();
});

// Controls
$(document).on("click", ".menu_submit_button", function() {
    $(".header_menu_icon").removeClass("hidden");
    $(".header_info_icon").removeClass("hidden");
    $(".header_cross_icon").addClass("hidden");

    $(".menu").addClass("hidden");
    $(".info").addClass("hidden");

    loadWorkingSubjects();
});
$(document).on("click", ".menu_save_button", function() {
    save();
});
$(document).on("click", ".menu_load_button", function() {
    $(".sch_load").trigger("click");
});
$(document).on("change", ".sch_load", function() {
    load();
});

// Schedule
$(document).on("click", ".schedule_cell_star", function() {
    if($(this).parent().css("border-left-style") === "solid") {
        $(this).parent().css("border-style", "dashed");
        scheduleIndexes = arrayRemove(scheduleIndexes, $(this).siblings(".day").html() + "|" +  $(this).siblings(".id").html());
    } else {
        $(this).parent().css("border-style", "solid");
        scheduleIndexes.push($(this).siblings(".day").html() + "|" + $(this).siblings(".id").html());
    }
    calculateFinSchedule();
});
$(document).on("click", ".schedule_cell_bin", function() {
    if($(this).parent().hasClass("schedule_cell_deleted")) {
        $(this).parent().removeClass("schedule_cell_deleted");
        scheduleFaded = arrayRemove(scheduleFaded, $(this).siblings(".day").html() + "|" + $(this).siblings(".id").html());
    } else {
        $(this).parent().addClass("schedule_cell_deleted");
        scheduleFaded.push($(this).siblings(".day").html() + "|" + $(this).siblings(".id").html());

        $(this).parent().css("border-style", "dashed");
        scheduleIndexes = arrayRemove(scheduleIndexes, $(this).siblings(".day").html() + "|" + $(this).siblings(".id").html());
        calculateFinSchedule();
    }
});
$(document).on("click", ".schedule_cell_bin_cc", function() {
    $(this).parent().remove();

    var scheduleToRemove;
    var id = $(this).siblings(".id").html();
    var day = +$(this).siblings(".day").html();
    $.each(scheduleCustom[day], function(i, sch) {
        if(sch.id === id) {
            scheduleToRemove = sch;
            return false;
        }
    });
    scheduleCustom[day] = arrayRemove(scheduleCustom[day], scheduleToRemove);

    calculateSchedule();
});
$(document).on("click", ".sch_add_button", function() {
    addCustomSchedule();
});

///////////////////////////////////// Menu /////////////////////////////////////
function loadStudies() {
    $(".header_message").html("Načítám studia...");

    $.ajax({
        url: "./load.php",
        method: "POST",
        data: {
            "a": "s",
            "b": ""
        },
        success: parseStudies
    });
}
function parseStudies(e) {
    // Parse studies
    var link_array = $(e).find("div#tab-bc").find("li.c-programmes__item").first().find("a.b-programme__link").prop("href").split("/");
    link_array.pop("");

    studies.push({
        name: "BIT",
        link: link_array[link_array.length - 2] + " " + link_array[link_array.length - 1],
    });

    $(e).find("div#tab-mgr").find("li.c-programmes__item").first().find("li.c-branches__item").each(function(i, stud) {
        var link_array = $(stud).find("h4.b-branch__title").children("a").prop("href").split("/");
        link_array.pop("");

        studies.push({
            name: "MIT " + $(stud).find("h4.b-branch__title").children("span").html(),
            link: link_array[link_array.length - 2] + " " + link_array[link_array.length - 1],
        });
    });

    $(".header_message").html("");
    $(".header_menu_icon").removeClass("hidden");
    $(".header_info_icon").removeClass("hidden");

    console.log(studies);

    $.each(studies, function(i, stud) {
        if(stud.name === "BIT") {
            $(".menu_stud_column").append(` <div class="menu_column_row">
                                                <input class="menu_column_row_checkbox menu_bit_checkbox" type="checkbox" name="bit" value="` + stud.link + `">
                                                <div class="menu_column_row_text">BIT</div>
                                                <div class="cleaner"></div>
                                            </div>`);
        } else {
            $(".menu_stud_column").append(` <div class="menu_column_row">
                                                <input class="menu_column_row_radio menu_mit_radio" type="radio" name="mit" value="` + stud.link + `">
                                                <div class="menu_column_row_text">` + stud.name + `</div>
                                                <div class="cleaner"></div>
                                            </div>`);
        }
    });
}

function loadSubjects() {
    $(".header_message").html("Načítám předměty...");

    $.ajax({
        url: "./load.php",
        method: "POST",
        data: {
            "a": "a",
            "b": "a"
        },
        success: parseSubjects,
        complete: function() {
            $.ajax({
                url: "./load.php",
                method: "POST",
                data: {
                    "a": "a",
                    "b": "b"
                },
                success: parseSubjects
            });
        }
    });
}
function parseSubjects(e) {
    // Parse subjects
    e = JSON.parse(e);
    $(".subjects").html($(e.b).filter("div.mother").children(".main").find(".table-responsive__holder:first"));

    var grade = 0;
    var sem = 0;
    var planYear;
    $.each($(".subjects table tbody"), function(i, table) {
        if(actMonth > 6) {
            planYear = actYear - grade;
        } else {
            planYear = actYear - grade - 1;
        }

        if(planYear < newPlanYear && e.a === "b" ||
           planYear >= newPlanYear && e.a === "a") {
            $.each($(table).children("tr"), function(i, tr) {
                if($(tr).children("td:eq(0)").children("sup").html() != "*)") {
                    if($(tr).css("background-color") == "rgb(255, 228, 192)") {
                        subjectsAll[sem][grade][0].push({
                            url: $(tr).children("td:eq(0)").children("a").attr("href").split("/")[5],
                            name: $(tr).children("th").html(),
                        })
                    } else if($(tr).css("background-color") == "rgb(255, 255, 208)") {
                        subjectsAll[sem][grade][1].push({
                            url: $(tr).children("td:eq(0)").children("a").attr("href").split("/")[5],
                            name: $(tr).children("th").html(),
                        })
                    }
                }
            });
        }

        if(sem == 1) {
            grade++;
            sem = 0;
        } else {
            sem++;
        }
    });

    // Write subjects
    if(e.a === "b") {
        $(".menu_com_sub").html("");
        for(sem = 0; sem < 2; sem++) {
            for(grade = 0; grade < 3; grade++) {
                $(".menu_com_sub").append(` <div class="menu_column_row ` + grade + ` ` + (sem === 0 ? "w" : "s") + ` hidden">
                                                <div class="menu_column_row_text_split">` + (grade + 1) + `BIT</div>
                                                <div class="cleaner"></div>
                                            </div>`);

                $.each(subjectsAll[sem][grade][0], function(i, sub) {
                    $(".menu_com_sub").append(` <div class="menu_column_row ` + grade + ` ` + (sem === 0 ? "w" : "s") + ` hidden">
                                                    <input class="menu_column_row_checkbox" type="checkbox" value="` + sub.url + `">
                                                    <div class="menu_column_row_text">` + sub.name + `</div>
                                                    <div class="cleaner"></div>
                                                </div>`);
                });
            }
        }

        $(".menu_opt_sub").html("");
        for(sem = 0; sem < 2; sem++) {
            for(grade = 0; grade < 3; grade++) {
                $(".menu_opt_sub").append(` <div class="menu_column_row ` + grade + ` ` + (sem === 0 ? "w" : "s") + ` hidden">
                                                <div class="menu_column_row_text_split">` + (grade + 1) + `BIT</div>
                                                <div class="cleaner"></div>
                                            </div>`);
                $.each(subjectsAll[sem][grade][1], function(i, sub) {
                    $(".menu_opt_sub").append(`<div class="menu_column_row ` + grade + ` ` + (sem === 0 ? "w" : "s") + ` hidden">
                                                    <input class="menu_column_row_checkbox" type="checkbox" value="` + sub.url + `">
                                                    <div class="menu_column_row_text">` + sub.name + `</div>
                                                    <div class="cleaner"></div>
                                               </div>`);
                });
            }
        }
        renderSubjects();
    }
}
function renderSubjects() {
    var sem = +$(".menu_column_row_radio[name='sem']:checked").prop("value");

    $.each($(".menu_com_sub .menu_column_row"), function(i, sub) {
        $(sub).addClass("hidden");
    });
    $.each($(".menu_opt_sub .menu_column_row"), function(i, sub) {
        $(sub).addClass("hidden");
    });

    $.each($(".menu_column_row_checkbox[name='grade']:checked"), function(i, gr) {
        var grade = $(gr).prop("value");

        $.each($(".menu_com_sub .menu_column_row"), function(i, sub) {
            if(sem === 0) {
                if($(sub).hasClass("w") && $(sub).hasClass(grade)) {
                    $(sub).removeClass("hidden");
                }
            } else {
                if($(sub).hasClass("s") && $(sub).hasClass(grade)) {
                    $(sub).removeClass("hidden");
                }
            }
        });
        $.each($(".menu_opt_sub .menu_column_row"), function(i, sub) {
            if(sem === 0) {
                if($(sub).hasClass("w") && $(sub).hasClass(grade)) {
                    $(sub).removeClass("hidden");
                }
            } else {
                if($(sub).hasClass("s") && $(sub).hasClass(grade)) {
                    $(sub).removeClass("hidden");
                }
            }
        });
    });
}
function loadWorkingSubjects() {
    subjectsWorking = [];
    $.each($(".menu_com_sub .menu_column_row"), function(i, sub) {
        if($(sub).children(".menu_column_row_checkbox").length != 0) {
            if($(sub).children(".menu_column_row_checkbox")[0].checked && !$(sub).hasClass("hidden")) {
                subjectsWorking.push({
                    name: $(sub).children(".menu_column_row_text").html(),
                    url: $(sub).children(".menu_column_row_checkbox").prop("value"),
                    data: []
                });
            }
        }
    });
    $.each($(".menu_opt_sub .menu_column_row"), function(i, sub) {
        if($(sub).children(".menu_column_row_checkbox").length != 0) {
            if($(sub).children(".menu_column_row_checkbox")[0].checked && !$(sub).hasClass("hidden")) {
                subjectsWorking.push({
                    name: $(sub).children(".menu_column_row_text").html(),
                    url: $(sub).children(".menu_column_row_checkbox").prop("value"),
                    data: []
                });
            }
        }
    });

    $(".menu_submit_button").prop("disabled", true);
    $(".menu_submit_button").addClass("menu_button_disabled");

    actWorkingSubjectIndex = 0;
    $(".ranges").html("");
    parseWorkingSubject("");
}
function parseWorkingSubject(e) {
    if(e != "") {
        $(".subject").html($(e).filter("div.mother").find("table#schedule"));

        $.each($(".subject").find("tbody").find("td:contains('výuky'), td:contains('lichý'), td:contains('sudý')"), function(i, td) {
            var tr = $(td).parent();
            var type = "c";
            var rooms = [];
            var groups = [];

            $.each($(tr).children("td").eq(2).children("a"), function(i, room) {
                rooms.push($(room).html());
            });
            $.each($(tr).children("td").eq(5).children("a"), function(i, group) {
                groups.push($(group).html());
            });

            if($(tr).children("td").eq(0).html() === "přednáška") {
                type = "p";
            } else {
                if($(tr).attr("style") === "background: #e8ffff") {
                    type = "d";
                } else {
                    type = "c";
                }

                if(type === "d") {
                    if((parseTimeTo($(tr).children("td").eq(4).html()) - parseTimeFrom($(tr).children("td").eq(3).html())) >= 2) {
                        type = "c";
                    }
                } else {
                    if((parseTimeTo($(tr).children("td").eq(4).html()) - parseTimeFrom($(tr).children("td").eq(3).html())) === 1) {
                        type = "d";
                    }
                }
            }

            subjectsWorking[actWorkingSubjectIndex].data.push({
                day: $(tr).children("th").html(),
                week: $(tr).children("td").eq(1).html(),
                type: type,
                from: parseTimeFrom($(tr).children("td").eq(3).html()),
                to: parseTimeTo($(tr).children("td").eq(4).html()),
                rooms: rooms,
                groups: groups
            });
        });

        $(".subject").html($(e).filter("div.mother").find("div.b-detail__body").children().children().slice(0, 20));
        $(".ranges").append(`   <a target="_blank" href="https://www.fit.vut.cz/study/course/` + subjectsWorking[actWorkingSubjectIndex].url + `">
                                    <div class="range">
                                        <div class="range_name">` + subjectsWorking[actWorkingSubjectIndex].name + `</div>
                                        <div class="range_value">` + $(".subject").find("p:contains('Rozsah')").parent().next().children().html() + `</div>
                                        <div class="cleaner"></div>
                                    </div>
                                </a>`);

        actWorkingSubjectIndex++;
    }

    if(actWorkingSubjectIndex < subjectsWorking.length) {
        $(".header_message").html("Načítám " + subjectsWorking[actWorkingSubjectIndex].name);
        $.ajax({
            url: "./load.php",
            method: "POST",
            data: {
                "a": "b",
                "b": subjectsWorking[actWorkingSubjectIndex].url
            },
            success: parseWorkingSubject
        });
    } else {
        $(".header_message").html("");
        $(".menu_submit_button").prop("disabled", false);
        $(".menu_submit_button").removeClass("menu_button_disabled");

        calculateSchedule();
    }
}

////////////////////////////////// Schledules //////////////////////////////////
function addCustomSchedule() {
    var lesson = {
        id: Date.now(),
        url: "",
        name: $(".sch_add_name").val(),
        from: +$(".sch_add_from").val(),
        to: +$(".sch_add_to").val(),
        groups: [],
        rooms: [$(".sch_add_room").val()],
        type: "cc",
        week: $(".sch_add_weeks").val(),
        layer: -1,
        real: true,
        visible: true
    };

    if(lesson.from >= lesson.to) {
        return;
    }
    if(typeof lesson.name === "undefined" || lesson.name === "") {
        return;
    }
    if(typeof lesson.rooms[0] === "undefined" || lesson.rooms[0] === "") {
        return;
    }


    if(+$(".sch_add_day").val() === 1) {
        scheduleCustom[0].push(lesson);
    } else if(+$(".sch_add_day").val() === 2) {
        scheduleCustom[1].push(lesson);
    } else if(+$(".sch_add_day").val() === 3) {
        scheduleCustom[2].push(lesson);
    } else if(+$(".sch_add_day").val() === 4) {
        scheduleCustom[3].push(lesson);
    } else if(+$(".sch_add_day").val() === 5) {
        scheduleCustom[4].push(lesson);
    }

    calculateSchedule();
}
function calculateSchedule() {
    var scheduleTemp;
    scheduleAll = [[], [], [], [], []];
    scheduleAllLayersCount = [0, 0, 0, 0, 0];

    $.each(subjectsWorking, function(i, sub) {
        $.each(sub.data, function(i, les) {
            var lesson = {
                id: makeHash(sub.name + ";" + les.from + ";" + les.to + ";" + les.rooms + ";" + les.groups + ";" + les.type + ";" + les.week + ";" + les.day),
                url: sub.url,
                name: sub.name,
                from: les.from,
                to: les.to,
                groups: les.groups,
                rooms: les.rooms,
                type: les.type,
                week: les.week,
                layer: -1,
                real: true,
                visible: true
            };

            if(les.day === "Po") {
                scheduleAll[0].push(lesson);
            } else if(les.day === "Út") {
                scheduleAll[1].push(lesson);
            } else if(les.day === "St") {
                scheduleAll[2].push(lesson);
            } else if(les.day === "Čt") {
                scheduleAll[3].push(lesson);
            } else if(les.day === "Pá") {
                scheduleAll[4].push(lesson);
            }
        });
    });

    // Rozlámání bloků
    scheduleTemp = [[], [], [], [], []];
    for(d = 0; d < 5; d++) {
        $.each(scheduleAll[d], function(i, sch) {
            if(sch.type === "c" && (sch.to - sch.from) > 3) {
                var count = Math.floor((sch.to - sch.from) / 2);
                var time = sch.from;

                for(k = 0; k < count; k++) {
                    var schX = {
                        url: sch.url,
                        name: sch.name,
                        from: time,
                        to: time + 2,
                        groups: sch.groups,
                        rooms: sch.rooms,
                        type: sch.type,
                        week: sch.week,
                        layer: -1,
                        real: false,
                        visible: true
                    };

                    scheduleTemp[d].push(schX);
                    time += 2;
                }
            } else {
                scheduleTemp[d].push(sch);
            }
        });
    }
    scheduleAll = scheduleTemp;

    // duplicity
    scheduleTemp = [[], [], [], [], []];
    for(d = 0; d < 5; d++) {
        for(o = 0; o < scheduleAll[d].length; o++) {
            if(scheduleAll[d][o].name != "null") {
                var sch = scheduleAll[d][o];
                for(p = o + 1; p < scheduleAll[d].length; p++) {
                    if(scheduleAll[d][p].name != "null") {
                        if(sch.name === scheduleAll[d][p].name &&
                           sch.from === scheduleAll[d][p].from &&
                           sch.to === scheduleAll[d][p].to &&
                           sch.week === scheduleAll[d][p].week &&
                           sch.type === scheduleAll[d][p].type &&
                           arrayEqual(sch.rooms, scheduleAll[d][p].rooms)) {
                            $.each(scheduleAll[d][p].groups, function(i, group) {
                                if(!sch.groups.includes(group)) {
                                    sch.groups.push(group);
                                }
                            });
                            scheduleAll[d][p].name = "null";
                        }
                    }
                }
                sch.groups.sort();
                scheduleTemp[d].push(sch);
            }
        }
    }
    scheduleAll = scheduleTemp;

    // optimalizace skupin
    for(d = 0; d < 5; d++) {
        $.each(scheduleAll[d], function(i, sch) {
            if(sch.groups.includes("1BIA") && sch.groups.includes("1BIB")) {
                sch.groups.push("1BIT");
                sch.groups = arrayRemove(sch.groups, "1BIA");
                sch.groups = arrayRemove(sch.groups, "1BIB");
            }
            if(sch.groups.includes("2BIA") && sch.groups.includes("2BIB")) {
                sch.groups.push("2BIT");
                sch.groups = arrayRemove(sch.groups, "2BIA");
                sch.groups = arrayRemove(sch.groups, "2BIB");
            }
            if(sch.groups.includes("3BIA") && sch.groups.includes("3BIB")) {
                sch.groups.push("3BIT");
                sch.groups = arrayRemove(sch.groups, "3BIA");
                sch.groups = arrayRemove(sch.groups, "3BIB");
            }
            sch.groups = arrayRemove(sch.groups, "1BIT");
            sch.groups = arrayRemove(sch.groups, "2BIT");
            sch.groups = arrayRemove(sch.groups, "3BIT");
            sch.groups.sort();
        });
    }

    // vlastní hodnoty
    for(i = 0; i < 5; i++) {
        $.each(scheduleCustom[i], function(i, sch) {
            sch.layer = -1;
        });
        scheduleAll[i] = scheduleAll[i].concat(scheduleCustom[i]);
    }

    // přednášky nahoru
    for(d = 0; d < 5; d++) {
        scheduleAll[d].sort(function(a, b) {
            if(a.type === "p" && b.type !== "p") {
                return -1;
            } else if(a.type !== "p" && b.type === "p") {
                return 1;
            }

            return 0;
        });
    }

    // vrstvy
    for(d = 0; d < 5; d++) {
        $.each(scheduleAll[d], function(i, sch) {
            var layer = 1;
            var noCollison = false;

            while(noCollison === false) {
                noCollison = true;
                $.each(scheduleAll[d], function(p, schX) {
                    if(schX.layer === layer) {
                        if(areIntervalsColide(sch.from, sch.to, schX.from, schX.to)) {
                            noCollison = false;
                            layer++;
                            return false;
                        }
                    }
                });
            }
            sch.layer = layer;
        });
    }

    // počet vrstev
    for(d = 0; d < 5; d++) {
        var maxLayer = 0;

        $.each(scheduleAll[d], function(i, sch) {
            if(sch.layer > maxLayer) {
                maxLayer = sch.layer;
            }
        });

        scheduleAllLayersCount[d] = maxLayer
    }

    showSchedule();
    calculateFinSchedule();
}
function showSchedule() {
    // Připravení rozvrhu
    for(d = 0; d < 5; d++) {
        $(".schedule_all").find(".schedule_row").eq(d).children(".schedule_row_layers").html("");
    }
    for(d = 0; d < 5; d++) {
        for(k = 0; k < scheduleAllLayersCount[d]; k++) {
            $(".schedule_all").find(".schedule_row").eq(d).children(".schedule_row_layers").append(`<div class="schedule_row_layer"></div>`);
        }
        if(scheduleAllLayersCount[d] != 0) {
            $(".schedule_all").find(".schedule_row").eq(d).children(".schedule_row_header").css("line-height", (scheduleAllLayersCount[d] * 72) + "px");
        } else {
            $(".schedule_all").find(".schedule_row").eq(d).children(".schedule_row_header").css("line-height", "72px");
        }
    }

    // Generování buněk
    for(d = 0; d < 5; d++) {
        var layersDiv = $(".schedule_all").find(".schedule_row").eq(d).children(".schedule_row_layers");
        var fullLength = +$(layersDiv).width();

        $.each(scheduleAll[d], function(i, sch) {
            if(sch.visible === true) {
                var id = sch.id;
                var bin = "schedule_cell_bin";
                var length = ((sch.to - sch.from) * (fullLength / 14)) - 6 - 6;
                var left = (sch.from * (fullLength / 14)) + 3;
                var layer = sch.layer;
                var classes = "";
                var rooms = "";
                var groups = "";

                if(sch.type === "cc") {
                    bin = "schedule_cell_bin_cc"
                }

                if(sch.type === "p") {
                    classes += "schedule_cell_type_p ";
                } else if(sch.type === "c" || sch.type === "cc") {
                    if(sch.real === false) {
                        classes += "schedule_cell_type_c_n ";
                    } else {
                        classes += "schedule_cell_type_c ";
                    }
                } else if(sch.type === "d") {
                    classes += "schedule_cell_type_d ";
                }

                if(sch.week === "lichý") {
                    classes += "schedule_cell_week_odd ";
                } else if(sch.week === "sudý") {
                    classes += "schedule_cell_week_even ";
                }

                $.each(sch.rooms, function(i, room) {
                    rooms += room + " ";
                });
                $.each(sch.groups, function(i, group) {
                    if(group[3] === "A") {
                        groups += "<span class='red'>" + group + "</span> ";
                    } else if(group[3] === "B") {
                        groups += "<span class='blue'>" + group + "</span> ";
                    } else {
                        groups += group + " ";
                    }
                });

                $(layersDiv).children(".schedule_row_layer").eq(layer - 1).append(`<div class="schedule_cell ` + classes + `" style="left: ` + left + `px; width: ` + length + `px">
                                                                                        <div class="schedule_cell_name"><a target="_blank" href="https://www.fit.vut.cz/study/course/` + sch.url + `">` + sch.name + `</a></div>
                                                                                        <div class="schedule_cell_rooms">` + rooms + `</div>
                                                                                        <div class="schedule_cell_desc">` + groups + `</div>
                                                                                        <div class="schedule_cell_star"></div>
                                                                                        <div class="` + bin + `"></div>
                                                                                        <div class="id hidden">` + id + `</div>
                                                                                        <div class="day hidden">` + d + `</div>
                                                                                </div>`)
            }
        });
    }
}
function calculateFinSchedule() {
    scheduleFin = [[], [], [], [], []];
    scheduleFinLayersCount = [0, 0, 0, 0, 0];

    var scheduleToRemove = [];
    $.each(scheduleIndexes, function(i, index) {
        var found = false;
        var day = +index.split("|")[0];
        var id = index.split("|")[1];

        $.each(scheduleAll[day], function(i, sch) {
            if(sch.id.toString() === id.toString()) {
                found = true;
                scheduleFin[day].push(sch);
                $(".id:contains(" + id +")").parent().css("border-style", "solid");

                return false;
            }
        });
        if(!found) {
            scheduleToRemove.push(index);
        }
    });
    $.each(scheduleToRemove, function(i, index) {
        scheduleIndexes = arrayRemove(scheduleIndexes, index);
    });

    scheduleToRemove = [];
    $.each(scheduleFaded, function(i, index) {
        var found = false;
        var day = +index.split("|")[0];
        var id = index.split("|")[1];

        $.each(scheduleAll[day], function(i, sch) {
            if(sch.id.toString() === id.toString()) {
                found = true;
                $(".id:contains(" + id +")").parent().addClass("schedule_cell_deleted");

                return false;
            }
        });
        if(!found) {
            scheduleToRemove.push(index);
        }
    });
    $.each(scheduleToRemove, function(i, index) {
        scheduleFaded = arrayRemove(scheduleFaded, index);
    });

    // vrstvy
    for(d = 0; d < 5; d++) {
        $.each(scheduleFin[d], function(i, sch) {
            sch.layer = -1;
            var layer = 1;
            var noCollison = false;

            while(noCollison === false) {
                noCollison = true;
                $.each(scheduleFin[d], function(p, schX) {
                    if(schX.layer === layer) {
                        if(areIntervalsColide(sch.from, sch.to, schX.from, schX.to)) {
                            noCollison = false;
                            layer++;
                            return false;
                        }
                    }
                });
            }
            sch.layer = layer;
        });
    }

    // počet vrstev
    for(d = 0; d < 5; d++) {
        var maxLayer = 0;

        $.each(scheduleFin[d], function(i, sch) {
            if(sch.layer > maxLayer) {
                maxLayer = sch.layer;
            }
        });

        scheduleFinLayersCount[d] = maxLayer;
    }

    showFinSchedule();
}
function showFinSchedule() {
    for(d = 0; d < 5; d++) {
        $(".schedule_fin").find(".schedule_row").eq(d).children(".schedule_row_layers").html("");
    }
    for(d = 0; d < 5; d++) {
        for(k = 0; k < scheduleFinLayersCount[d]; k++) {
            $(".schedule_fin").find(".schedule_row").eq(d).children(".schedule_row_layers").append(`<div class="schedule_row_layer"></div>`);
        }
        if(scheduleFinLayersCount[d] != 0) {
            $(".schedule_fin").find(".schedule_row").eq(d).children(".schedule_row_header").css("line-height", (scheduleFinLayersCount[d] * 72) + "px");
        } else {
            $(".schedule_fin").find(".schedule_row").eq(d).children(".schedule_row_header").css("line-height", "72px");
        }
    }

    for(d = 0; d < 5; d++) {
        var layersDiv = $(".schedule_fin").find(".schedule_row").eq(d).children(".schedule_row_layers");
        var fullLength = +$(layersDiv).width();

        $.each(scheduleFin[d], function(k, sch) {
            var length = ((sch.to - sch.from) * (fullLength / 14)) - 6 - 6;
            var left = (sch.from * (fullLength / 14)) + 3;
            var layer = sch.layer;
            var classes = "";
            var rooms = "";
            var groups = "";

            if(sch.type === "p") {
                classes += "schedule_cell_type_p ";
            } else if(sch.type === "c" || sch.type === "cc") {
                classes += "schedule_cell_type_c ";
            } else if(sch.type === "d") {
                classes += "schedule_cell_type_d ";
            }

            if(sch.week === "lichý") {
                classes += "schedule_cell_week_odd ";
            } else if(sch.week === "sudý") {
                classes += "schedule_cell_week_even ";
            }

            $.each(sch.rooms, function(i, room) {
                rooms += room + " ";
            });
            $.each(sch.groups, function(i, group) {
                if(group[3] === "A") {
                    groups += "<span class='red'>" + group + "</span> ";
                } else if(group[3] === "B") {
                    groups += "<span class='blue'>" + group + "</span> ";
                } else {
                    groups += group + " ";
                }
            });

            $(layersDiv).children(".schedule_row_layer").eq(layer - 1).append(`<div class="schedule_cell schedule_cell_selected ` + classes + `" style="left: ` + left + `px; width: ` + length + `px">
                                                                                    <div class="schedule_cell_name">` + sch.name + `</div>
                                                                                    <div class="schedule_cell_rooms">` + rooms + `</div>
                                                                                    <div class="schedule_cell_desc">` + groups + `</div>
                                                                               </div>`)
        });
    }
}

//////////////////////////////////// SAVING ////////////////////////////////////
function save() {
    var file = {
        grades: [],
        sem: undefined,
        com_sub: [],
        opt_sub: [],
        custom: [],
        faded: [],
        indexes: []
    }
    $.each($(".menu_column_row_checkbox[name='grade']:checked"), function(i, gr) {
        file.grades.push($(gr).prop("value"));
    });
    file.sem = +$(".menu_column_row_radio[name='sem']:checked").prop("value");

    $.each($(".menu_com_sub .menu_column_row"), function(i, sub) {
        if($(sub).children(".menu_column_row_checkbox").length != 0) {
            if($(sub).children(".menu_column_row_checkbox")[0].checked) {
                file.com_sub.push($(sub).children(".menu_column_row_text").html());
            }
        }
    });
    $.each($(".menu_opt_sub .menu_column_row"), function(i, sub) {
        if($(sub).children(".menu_column_row_checkbox").length != 0) {
            if($(sub).children(".menu_column_row_checkbox")[0].checked) {
                file.opt_sub.push($(sub).children(".menu_column_row_text").html());
            }
        }
    });

    var scheduleToRemove = [];
    $.each(scheduleFaded, function(i, index) {
        var found = false;
        var day = +index.split("|")[0];
        var id = index.split("|")[1];

        $.each(scheduleAll[day], function(i, sch) {
            if(sch.id.toString() === id.toString()) {
                found = true;
                return false;
            }
        });
        if(!found) {
            scheduleToRemove.push(index);
        }
    });
    $.each(scheduleToRemove, function(i, index) {
        scheduleFaded = arrayRemove(scheduleFaded, index);
    });

    file.custom = scheduleCustom;
    file.faded = scheduleFaded;
    file.indexes = scheduleIndexes;

    file = JSON.stringify(file);
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(file));
    element.setAttribute('download', "schledule.json");
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}
function load() {
    var file;
    if(!$(".sch_load")[0].files[0]) {
        $(".header_message").html("Nevybrán žádný soubor");
    }

    var reader = new FileReader();
    reader.readAsText($(".sch_load")[0].files[0], "UTF-8");
    reader.onload = function (e) {
        try {
            file = JSON.parse(e.target.result);
        } catch(e) {
            $(".header_message").html("Chyba při parsování souboru");
        }

        $.each($(".menu_column_row_checkbox[name='grade']"), function(i, gr) {
            if(file.grades.includes($(gr).prop("value"))) {
                $(gr).prop("checked", true);
            } else {
                $(gr).prop("checked", false);
            }
        });
        if(file.sem === 0) {
            $(".menu_column_row_radio[name='sem'][value='0']").prop("checked", true);
        } else {
            $(".menu_column_row_radio[name='sem'][value='1']").prop("checked", true);
        }

        $.each($(".menu_com_sub .menu_column_row"), function(i, sub) {
            if(file.com_sub.includes($(sub).children(".menu_column_row_text").html())) {
                $(sub).children("input").prop("checked", true);
            } else {
                $(sub).children("input").prop("checked", false);
            }
        });
        $.each($(".menu_opt_sub .menu_column_row"), function(i, sub) {
            if(file.opt_sub.includes($(sub).children(".menu_column_row_text").html())) {
                $(sub).children("input").prop("checked", true);
            } else {
                $(sub).children("input").prop("checked", false);
            }
        });

        scheduleCustom = file.custom;
        scheduleFaded = file.faded;
        scheduleIndexes = file.indexes;

        $(".header_menu_icon").css("background-image", "url(./images/menu.png)")
        $(".menu").addClass("hidden");
        renderSubjects();
        loadWorkingSubjects();
    }
    reader.onerror = function (e) {
        $(".header_message").html("Chyba při čtení souboru");
    }
}

//////////////////////////////////// Helpers ///////////////////////////////////
function areIntervalsColide(a, b, x, y) {
    a *= 10;
    b *= 10;
    x *= 10;
    y *= 10;

    for(o = a + 5; o < b; o += 10) {
        for(p = x + 5; p < y; p += 10) {
            if(o === p) {
                return true;
            }
        }
    }
    return false;
}
function parseTimeFrom(string) {
    var hours = +string.split(":")[0];
    return hours - 7;
}
function parseTimeTo(string) {
    var hours = +string.split(":")[0] + 1;
    return hours - 7;
}
function arrayRemove(array, value) {
    return array.filter(function(element) {
        return element != value;
    });
}
function arrayEqual(arrayA, arrayB) {
    if(arrayA.length != arrayB.length) {
        return false;
    }

    for(i = 0; i < arrayA.length; i++) {
        if(!arrayB.includes(arrayA[i])) {
            return false;
        }
    }
    return true;
}
function makeHash(string) {
    var hash = 0, i, chr;

    if(string.length === 0) {
        return hash;
    }
    for(i = 0; i < string.length; i++) {
        chr   = string.charCodeAt(i);
        hash  = ((hash << 5) - hash) + chr;
        hash |= 0;
    }

    if(Number.isInteger(hash)) {
        hash = Math.abs(hash);
    }
    return hash.toString();
};
