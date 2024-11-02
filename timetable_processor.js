const https = require('https');
const cheerio = require('cheerio'); // Include cheerio for HTML parsing

module.exports = { getStudiesData, getSubjectData }

// Fetch and parse study plans
function getStudiesData(year, callback) {
    const urlToFetch = 'https://www.fit.vut.cz/study/programs/?year=' + encodeURIComponent(year);
    const options = {
        headers: {
            'Accept-language': 'cs'
        }
    };

    https.get(urlToFetch, options, (response) => {
        let data = '';

        response.on('data', (chunk) => {
            data += chunk;
        });

        response.on('end', () => {
            // Parse the HTML data
            parseStudiesData(data, year, callback);
        });

    }).on('error', (err) => {
        callback(err);
    });
}

// Fetch and parse subject data
function getSubjectData(subjects, year, callback) {
    let subjectData = [];
    let pending = subjects.length;

    if (pending === 0) {
        callback(null, { lessons: [], ranges: [] });
        return;
    }

    subjects.forEach((sub) => {
        const parts = sub.link.split('-');
        const b = parts[0];
        const c = parts[1];

        const urlToFetch = 'https://www.fit.vut.cz/study/' + encodeURIComponent(b) + '/' + encodeURIComponent(c) + '/.cs';
        const options = {
            headers: {
                'Accept-language': 'cs'
            }
        };

        https.get(urlToFetch, options, (response) => {
            let data = '';

            response.on('data', (chunk) => {
                data += chunk;
            });

            response.on('end', () => {
                try {
                    const $ = cheerio.load(data);

                    // Fetch the subject name from the page
                    const subjectName = $('.b-detail__annot-item[itemprop="courseCode"]').text().trim() || 'Unknown';

                    // Assign the name to sub
                    sub.name = subjectName;

                    // Parse range
                    const rangeElement = $('main').find('div.b-detail__body').find('div.grid__cell').find("p:contains('Rozsah')").parent().next().children();
                    const rangeHtml = rangeElement.html() || 'neznámý rozsah výuky';

                    // Parse lessons
                    let lessons = [];
                    let disabledTypes = [];
                    let enabledTypes = [];

                    $('table#schedule').find('tbody').find('tr').each((o, tr) => {
                        const $tr = $(tr);
                        const typeHtml = $tr.children('td').eq(0).html() || '';
                        const weekHtml = $tr.children('td').eq(1).html() || '';
                        const capacityHtml = $tr.children('td').eq(5).html() || '';

                        const typeText = $tr.children('td').eq(0).children('span').text();

                        if (
                            (typeHtml.includes('přednáška') ||
                                typeHtml.includes('poč. lab') ||
                                typeHtml.includes('cvičení') ||
                                typeHtml.includes('laboratoř') ||
                                typeHtml.includes('seminář')) &&
                            (weekHtml.includes('výuky') ||
                                weekHtml.includes('sudý') ||
                                weekHtml.includes('lichý') ||
                                weekHtml.trim().match(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/))
                        ) {
                            if (capacityHtml != '0' && !typeHtml.includes('*)')) {
                                enabledTypes.push(typeText);
                            } else {
                                disabledTypes.push(typeText);
                            }
                        }
                    });

                    // Remove enabled lessons from disabled lessons
                    enabledTypes.forEach((type) => {
                        disabledTypes = disabledTypes.filter((x) => x !== type);
                    });

                    // Parse lessons
                    $('table#schedule').find('tbody').find('tr').each((o, tr) => {
                        const $tr = $(tr);
                        const typeHtml = $tr.children('td').eq(0).html() || '';
                        const weekHtml = $tr.children('td').eq(1).html() || '';
                        const capacityHtml = $tr.children('td').eq(5).html() || '';

                        const typeText = $tr.children('td').eq(0).children('span').text();

                        if (
                            (typeHtml.includes('přednáška') ||
                                typeHtml.includes('poč. lab') ||
                                typeHtml.includes('cvičení') ||
                                typeHtml.includes('laboratoř') ||
                                typeHtml.includes('seminář')) &&
                            (weekHtml.includes('výuky') ||
                                weekHtml.includes('sudý') ||
                                weekHtml.includes('lichý') ||
                                weekHtml.trim().match(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/)) &&
                            ((capacityHtml != '0' && !typeHtml.includes('*)')) || disabledTypes.includes(typeText))
                        ) {
                            const lesson = {
                                id: '',
                                name: sub.name,
                                link: sub.link,
                                day: parseDay($tr.children('th').text()),
                                week: parseWeek($tr.children('td').eq(1).html()),
                                from: parseTimeFrom($tr.children('td').eq(3).html()),
                                to: parseTimeTo($tr.children('td').eq(4).html()),
                                group: $tr.children('td').eq(7).text().replace('xx', '').trim(),
                                info: $tr.children('td').eq(8).html(),
                                type: 'unknown',
                                rooms: [],
                                layer: 1,
                                selected: false,
                                deleted: false
                            };

                            // Check if week is valid
                            if (lesson.week == null) {
                                return;
                            }

                            // Determine type
                            lesson.type = getLessonType(typeHtml);

                            // Rooms
                            $tr.children('td').eq(2).find('a').each((p, a) => {
                                lesson.rooms.push($(a).text().trim());
                            });

                            // Combine rooms (implement room combination logic)
                            lesson.rooms = combineRooms(lesson.rooms);

                            // Generate ID
                            lesson.id = 'LOAD_' + makeHash(lesson.name + ';' + lesson.day + ';' + lesson.week + ';' + lesson.from + ';' + lesson.to + ';' + lesson.type + ';' + JSON.stringify(lesson.rooms));

                            lessons.push(lesson);
                        }
                    });

                    // Parse ranges
                    const ranges = parseRanges(rangeHtml, sub.name, sub.link);

                    // Collect data
                    subjectData.push({
                        lessons: lessons,
                        ranges: ranges
                    });

                    pending--;
                    if (pending === 0) {
                        // All subjects processed
                        let allLessons = [];
                        let allRanges = [];

                        subjectData.forEach((sd) => {
                            allLessons = allLessons.concat(sd.lessons);
                            allRanges = allRanges.concat(sd.ranges);
                        });

                        callback(null, { lessons: allLessons, ranges: allRanges });
                    }
                } catch (e) {
                    pending--;
                    if (pending === 0) {
                        callback(null, { lessons: [], ranges: [] });
                    }
                }
            });
        }).on('error', (err) => {
            pending--;
            if (pending === 0) {
                callback(null, { lessons: [], ranges: [] });
            }
        });
    });
}



function parseStudiesData(htmlData, year, callback) {
    try {
        const $ = cheerio.load(htmlData);

        let studies = [];
        let years = [];

        // Parse BIT
        let bitLink = $('div#bc').find('li.c-programmes__item').first().find('a.b-programme__link').attr('href');
        studies.push({
            "name": "BIT",
            "link": parseLinkForSubjectEndpoint(bitLink),
            "subjects": {
                "com": [[], [], []],
                "opt": [[], [], []]
            }
        });

        // Parse MIT
        $('div#mgr').find('li.c-programmes__item').find('li.c-branches__item').each((i, li) => {
            let tag = $(li).find('span.tag').text();

            // Only new MGR program
            if (!tag.startsWith('N'))
                return;

            let mitName = "MIT-" + tag;
            let mitLink = $(li).find('a.b-branch__link').attr('href');

            studies.push({
                "name": mitName,
                "link": parseLinkForSubjectEndpoint(mitLink),
                "subjects": {
                    "com": [[], [], []],
                    "opt": [[], [], []]
                }
            });
        });

        // Parse years
        $('select#year').find('option').each((i, opt) => {
            years.push({
                value: Number($(opt).attr('value')),
                name: $(opt).text()
            });
        });

        // Load subjects for each study
        let pending = studies.length;
        if (pending === 0) {
            // No studies found
            callback(null, { studies: studies, years: years });
            return;
        }

        studies.forEach((stud, index) => {
            loadSubjectsForStudy(stud, () => {
                pending--;
                if (pending === 0) {
                    // All studies processed
                    callback(null, { studies: studies, years: years });
                }
            });
        });

    } catch (e) {
        callback(e);
    }
}

function loadSubjectsForStudy(stud, done) {
    const parts = stud.link.split("-");
    const b = parts[0];
    const c = parts[1];

    const urlToFetch = 'https://www.fit.vut.cz/study/' + encodeURIComponent(b) + '/' + encodeURIComponent(c) + '/.cs';
    const options = {
        headers: {
            'Accept-language': 'cs'
        }
    };

    https.get(urlToFetch, options, (response) => {
        let data = '';

        response.on('data', (chunk) => {
            data += chunk;
        });

        response.on('end', () => {
            parseSubjectsData(data, stud);
            done();
        });

    }).on('error', (err) => {
        done(err);
    });
}

function parseSubjectsData(htmlData, stud) {
    const $ = cheerio.load(htmlData);

    let sem = "winter";
    let grade = 0;

    $('main').first().find('div.table-responsive').first().find('tbody').each((o, tbody) => {
        $(tbody).children('tr').each((p, tr) => {
            let subjectName = $(tr).children('th').text();
            let subjectLink = $(tr).children('td').first().children('a').attr('href');

            let subject = {
                "name": subjectName,
                "sem": sem,
                "link": parseLinkForSubjectEndpoint(subjectLink)
            };

            // Determine if it's compulsory or optional
            const subjType = $($(tr).children('td').get(2)).text();
            if (subjType === 'P') {
                stud.subjects.com[grade].push(subject);
            } else {
                stud.subjects.opt[grade].push(subject);
            }
        });

        // Increment semester and grade
        if (sem === 'winter') {
            sem = 'summer';
        } else {
            sem = 'winter';
            grade++;
        }
    });
}

function parseLinkForSubjectEndpoint(link) {
    if (link.endsWith('.cs')) {
        link = link.substring(0, link.length - 4);
    }

    var linkArray = link.split("/");
    linkArray = linkArray.filter(x => x != "");
    return linkArray[linkArray.length - 2] + "-" + linkArray[linkArray.length - 1];
}

function parseDay(day) {
    if (day === "Po") {
        return 0;
    } else if (day === "Út") {
        return 1;
    } else if (day === "St") {
        return 2;
    } else if (day === "Čt") {
        return 3;
    } else if (day === "Pá") {
        return 4;
    }
    // Return as-is if not recognized
    return day;
}

function parseWeek(week) {
    week = week.replace("výuky", "");
    week = week.replace(/,/g, "");
    week = week.trim();
    if (week.match(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/)) {
        var weekNum = getSemesterWeekFromDate(new Date(week));
        if (weekNum < 1) return null;
        return weekNum + ".";
    }
    return week;
}

function parseTimeFrom(time) {
    var hours = +time.split(":")[0];
    return hours - 7;
}

function parseTimeTo(time) {
    var hours = +time.split(":")[0] + 1;
    return hours - 7;
}

function makeHash(string) {
    var hash = 0, i, chr;

    if (string.length === 0) {
        return hash;
    }
    for (i = 0; i < string.length; i++) {
        chr = string.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0;
    }

    if (Number.isInteger(hash)) {
        hash = Math.abs(hash);
    }
    return hash.toString();
}

function getLessonType(typeHtml) {
    if (typeHtml.includes('přednáška')) {
        return 'green';
    } else if (typeHtml.includes('cvičení') || typeHtml.includes('seminář')) {
        return 'blue';
    } else if (typeHtml.includes('poč. lab') || typeHtml.includes('laboratoř')) {
        return 'yellow';
    } else {
        return 'unknown';
    }
}

function combineRooms(rooms) {
    // Implement room combination logic from your original code
    // For example:
    if (rooms.includes("E112") && rooms.includes("E104") && rooms.includes("E105")) {
        rooms = rooms.filter(x => x !== "E112" && x !== "E104" && x !== "E105");
        rooms.push("E112+4,5");
    }
    // Add other combinations as needed
    return rooms;
}

function parseRanges(rangeHtml, subjectName, subjectLink) {
    // Parse the ranges from the HTML
    let ranges = [];

    const $ = cheerio.load('<ul>' + rangeHtml + '</ul>'); // Wrap in ul to parse li elements correctly
    const listItems = $('li');
    let greenRange = 0;
    let blueRange = 0;
    let yellowRange = 0;

    listItems.each((i, li) => {
        const text = $(li).text().trim();
        const parts = text.split(' ');
        if (parts.length >= 2) {
            const value = parseInt(parts[0]);
            if (isNaN(value)) return;

            const type = parts[2];
            if (type === 'přednášky') {
                greenRange = value;
            } else if (type === 'cvičení' || type === 'seminář') {
                blueRange = value;
            } else if (type === 'pc' || type === 'laboratoře') {
                yellowRange = value;
            }
        }
    });

    // Construct the range object
    const range = {
        name: subjectName,
        link: subjectLink,
        raw: rangeHtml,
        greenRange: greenRange,
        blueRange: blueRange,
        yellowRange: yellowRange
        // Add more properties if needed
    };

    ranges.push(range);
    return ranges;
}

function getSemesterWeekFromDate(date) {
    // Adjusted to include more years and avoid errors
    var winterStart = { 2022: "2022-09-19", 2023: "2023-09-18", 2024: "2024-09-16" };
    var summerStart = { 2023: "2023-02-06", 2024: "2024-02-05", 2025: "2025-02-03" };
    var dateWeek = getWeekNumber(date);
    var year = date.getFullYear();
    var winterStartWeek = getWeekNumber(new Date(winterStart[year]));
    var summerStartWeek = getWeekNumber(new Date(summerStart[year]));
    var relativeWinterWeek = dateWeek - winterStartWeek + 1;
    var relativeSummerWeek = dateWeek - summerStartWeek + 1;
    if (relativeWinterWeek >= 1 && relativeWinterWeek <= 13) {
        return relativeWinterWeek;
    } else if (relativeSummerWeek >= 1 && relativeSummerWeek <= 13) {
        return relativeSummerWeek;
    } else {
        console.warn("Date " + date + " is not in any semester week, so will be ignored");
        return -1;
    }
}

function getWeekNumber(d) {
    // Copy date so don't modify original
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    // Set to nearest Thursday: current date + 4 - current day number
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    // Get first day of year
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    // Calculate full weeks to nearest Thursday
    var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
}