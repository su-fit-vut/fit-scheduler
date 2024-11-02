# FIT Timetable Scheduler

This is a simple web app for planning a timetable of semester courses at FIT.

It is a fork of the original scheduler developed by Kubosh. The goals of this fork include:
- shifting the process of loading the timetable data to the backend,
- using the API provided by BUT IS instead of parsing webpages,
- refactoring the frontend code,
- removing transphobic content.

We would like to express our gratitude to the original author(s) for helping several generations of FIT students.

## Execution

The backend is a simple NodeJS app that uses Express. It also serves the frontend app which is a single HTML page backed by a cluttered, jQuery-powered script.

```sh
npm install
npm start
```