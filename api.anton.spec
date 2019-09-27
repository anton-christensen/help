# departments
GET: /departments
	- all: gets all departments
GET: /departments/{:dpslug}
	- all: get specific department (not including courses)

# courses
GET: /courses
	- anon/TA: disallow
	- Admin/Lecturer: All courses they're associated with
POST: /courses
	- anon/TA: disallow
	- Lect/admin: allowed
GET: /departments/{:dpslug}/courses
	- anon: get active courses on department
	- TA/Lect: get active & associated courses on department
	- admin: get all courses on department
GET: /departments/{:dpslug}/courses/{:cslug}
	- // includes posts
	- all: get the course
PUT: /departments/{:dpslug}/courses/{:cslug}
	- // can't change posts
	- anon: disallow
	- TA: allowed to update "enabled" if associated with course
	- Lect: allowed if associated with course
	- admin : allowed
DELETE: /departments/{:dpslug}/courses/{:cslug}
	- anon/TA: disallow
	- Lect: allowed if associated with course
	- admin: allowed

# posts
POST: /departments/{:dpslug}/courses/{:cslug}/posts
	- anon: disallow
	- TA/Lect: allowed if associated
	- admin: allowed
PUT: /departments/{:dpslug}/courses/{:cslug}/posts/{:postID}
	- anon: disallow
	- TA/Lect: allowed if associated
	- admin: allowed

# trashcans
GET /departments/{:dpslug}/courses/{:cslug}/trashcans
	- anon: allowed (gets your own trashcan)
	- TA/Lecturer: if associated, gets all trashcans, else gets your trashcan
	- Admin: allowed (gets all trashcans)
POST /departments/{:dpslug}/courses/{:cslug}/trashcans
	- all: add a trashcan to the course, tied to your userID
DELETE /departments/{:dpslug}/courses/{:cslug}/trashcans/{:userID}
	- all: remove your trashcan (soft delete)

# users
GET: /user
	- anon: gets anon user and new auth token
	- TA/Lecturer/admin: gets their users and their provided auth token
POST: /users
	- anon/TA: disallow
	- Lecturer: allow, but role can only be set to student or TA
	- admin: allow

GET: /user/_auth
	- the service that AAU CAS recieves which will check if the user 
		is authorized and if- then redirects to the target given as query param

GET: /users?q=achri15@
	- anon/TA: disallow
	- Lect/Admin: allow


# notifications
GET: /departments/{:dpslug}/courses/{:cslug}/trashcans/notificationtokens
	- admin: allow
	- TA/lecturer: allow if associated with course
	- other: disallow

POST: /departments/{:dpslug}/courses/{:cslug}/trashcans/notificationtokens
	- admin: allow
	- TA/lecturer: allow if associated with course
	- other: disallow

DELETE: /departments/{:dpslug}/courses/{:cslug}/trashcans/notificationtokens
	- all: allow