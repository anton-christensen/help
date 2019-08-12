# Help

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 7.3.6.

The primary purpose is to register rooms that need help with exercises.
It is intended as a replacement for a trash can-based system, where students who needs help with exercises would place the rooms trash can outside the door.

When we talk about **a trash can being put out**, we refer to the action of a user requesting help via the system.

## User stories

### Student

> A student is working on exercises in their group room and has a question that the group can't figure out themselves.
  On the moodle group for the course there is a link to https://help.aau.dk/cs/alg.
  On this page the student can enter their room number and shortly a teaching assistant or lecturer will be in the room to answer their question.

> If a question is common or there's a mistake in the exercises, the lecturer or TA's will have written a note on the page.

### Teaching assistant (or lecturer)

> The assistant recieves a notification on their phone when a new trash can is put out.
  Tapping the notification shows a page on help.aau.dk where the assistant has a list of rooms that need help, ordered by the time they arrived in.
  The assistant walks to a room on the list and clicks a button that removes the room from the list, walks in and tries to help the group with their question.

### Lecturer (or administrator)

> The lecturer hires a new TA to help with exercices.
  The TA creates a user.
  The lecturer associates the TA with their course by searching for the users name or email.

### Administrator

> A new lecturer needs to use the system for the first time.
  The lecturer creates a user.
  The administrator changes the lecturers role from student (default) to lecturer.
  The lecturer can now create new courses or modify courses they've been associated with by other lecturers (in the case of taking over a course from another lecturer).

## Development

### Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

### Deployment

Run `ng build --prod && firebase deploy --only hosting` to build the project and push it to Google firebase

### Database structure

Here follows prescriptions of the datastructures.
Please update the following sections to the desired structure, before making changes to the code or database.

#### Courses

| Field         | Type     | Links to  | Explanation |
|---------------|----------|-----------|-------------|
| id            | string   |           | Unique identifier, assigned by the database. |
| title         | string   |           | Full name of the course e.g. "Diskret matematik". |
| slug          | string   |           | Lowercase shorthand of course used for URL part e.g. "dmat". |
| instituteSlug | string   | Institute | Lowercase shorthand of the course's associated institute used for URL part e.g. "cs". |
| enabled       | boolean  |           | Weather an exercise session is currently running or not. Assistants can toggle this. |
| assistants    | string[] | Users     | List of IDs of users associated with the course i.e. |

#### Institute

Institutes can **not** be edited through the system (maybe this should be possible later).
For now, if additions or changes to the list of institutes are neccessary, a developer should make the changes directly through the database.

| Field         | Type     | Links to  | Explanation |
|---------------|----------|-----------|-------------|
| id            | string   |           | Unique identifier, assigned by the database. |
| title         | string   |           | Full name of the institute e.g. "Institut for Datalogi". |
| slug          | string   |           | Lowercase shorthand of institute used for URL part e.g. "cs". |
| faculty       | string   |           | Full name of the faculty which the institute is under e.g. "Det Tekniske Fakultet for IT og Design". |

#### Notification Token

Describes an assistants request to have a notification sent to a device, when a new trash can is put out for a specified course.

| Field         | Type     | Links to  | Explanation |
|---------------|----------|-----------|-------------|
| id            | string   |           | Unique identifier, assigned by the database. |
| token         | string   |           | The notification token itself. |
| deviceId      | number   |           | Identifier of the device. |
| userId        | string   | User      | ID of user. |
| courseId      | string   | Course    | ID of the course the user wants notifications for. |

#### Post

| Field         | Type     | Links to  | Explanation |
|---------------|----------|-----------|-------------|
| id            | string   |           | Unique identifier, assigned by the database. |
| courseID      | string   | Course    | The id of the course this post was posted on. |
| content       | string   |           | The markdown representation of the post content. |
| created       | string   |           | Time and date for when the post was posted. |

#### Trash Can

| Field         | Type     | Links to  | Explanation |
|---------------|----------|-----------|-------------|
| id            | string   |           | Unique identifier, assigned by the database. |
| userID        | string   | User      | ID of the user who put out the trash can. |
| courseID      | string   | Course    | ID of the course for which this trash can was put out. |
| room          | string   |           | A short user-entered descriptor that identifies the room e.g. "Novi 9 - 1.32.44". |
| active        | boolean  |           | *True* when the trash can is put out, *False* when the can is remove by an assistant. We do this soft-deletion, in order to be able to do statistics on this data later. |
| created       | string   |           | Time and date for when the post was posted. |

#### User

| Field         | Type     | Links to  | Explanation |
|---------------|----------|-----------|-------------|
| uid           | string   |           | Unique identifier, assigned by the database. |
| email         | string   |           | The email of the user. This must be unique. |
| imageURL      | string   |           | An optional URL to an image of the user. |
| anon          | boolean  |           | Is true for students who are not logged in. |
| name          | string   |           | The display name of the user. |
| role          | Role     |           | The role of the user (admin, lecturer, assistant or student). |
