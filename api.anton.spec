# departments
GET: /departments
	- all: gets all departments
GET: /departments/{:dpslug}
	- all: get specific department (not including courses)

# courses
GET: /courses
	- anon/TA: disallow
	- Admin/Lecturer: All courses they're associated with
GET: /departments/{:dpslug}/courses
	- anon: get active courses on department
	- TA/Lect: get active & associated courses on department
	- admin: get all courses on department
GET: /departments/{:dpslug}/courses/{:cslug}
	- all: get the course
POST: /departments/{:dpslug}/courses/{:cslug}
	- anon/TA: disallow
	- Lect/admin: allowed
PUT: /departments/{:dpslug}/courses/{:cslug}
	- anon: disallow
	- TA: allowed to update "enabled" if associated with course
	- Lect: allowed if associated with course
	- admin : allowed
DELETE: /departments/{:dpslug}/courses/{:cslug}
	- anon/TA: disallow
	- Lect: allowed if associated with course
	- admin: allowed

# users
GET: /user
	- anon: gets anon user
	- TA/Lecturer/admin: gets their users
GET: /user/_auth
	- the service that AAU CAS recieves which will check if the user 
		is authorized and if- then redirects to the target given as query param

GET: /users?q=achri15@
	- anon/TA: disallow
	- Lect/Admin: allow
