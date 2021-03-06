# Webgallery REST API Documentation

## Authentication
***
### Sign-Up

- description: create an account
- request: `POST /signup/`
  - content-type: `application/json`
  - body: object
    - username: (string) the name of the user
    - password: (string) the user's password
- response: 200
  - content-type: `application/json`
  - body: string
    - User :username signed up
- response: 401
  - content-type: `application/json`
  - body: string
    - Access denied
- response: 409
  - content-type: `application/json`
  - body: string
    - Username :username already exists

```
$curl -X POST
      -H "Content-Type: `application/json`"
      -d '{"username":"unicorn","password":"rainbow"}'
      -c cookie.txt
      http://localhost:3000/signup/'
```
***
### Sign-In

- description: sign in to account
- request: `POST /signin/`
  - content-type: `application/json`
  - body: object
    - username: (string) the name of the user
    - password: (string) the user's password
- response: 200
  - content-type: `application/json`
  - body: string
    - User :username signed in
- response: 401
  - content-type: `application/json`
  - body: string
    - Username or password is incorrect

```
$curl -X POST
      -H "Content-Type: `application/json`"
      -d '{"username":"unicorn","password":"rainbow"}
      -c cookie.txt
      http://localhost:3000/signin/'
```
***
### Sign-Out

- description: sign out of account
- request: `GET /signout/`
- response: 200
  - content-type: `application/json`
  - body: string
    - You have signed out
- response: 401
  - content-type: `application/json`
  - body: string
    - Access denied

```
$ curl -b cookie.txt
       -c cookie.txt
       http://localhost:3000/signout/
```
***
## Image API
***
### Create

- description: create a new image
- request: `POST /api/images/`
  - content-type: `multipart/form-data`
  - body: object
    - title: (string) the title of the image
    - imageFile: (file) the image file that was uploaded
- response: 200
  - content-type: `application/json`
  - body: object
    - _id: (string) the image id
    - title: (string) the title of the image
    - date: (date) the timestamp the image was created
- response: 401
  - content-type: `application/json`
  - body: string
    - Access denied

```
$curl -X POST
      -H "Content-Type: `application/json`"
      -d '{"title":"Rainbow Unicorn","imageFile":"squirtle.png"}
      -c cookie.txt
      http://localhost:3000/api/images/'
```
***
### Read

- description: retrieve all image objects for selected user
- request: `GET /api/users/:user/images/`
- response: 200
  - content-type: `application/json`
  - body: list of objects
    - _id: (string) the image id
    - title: (string) the title of the image
    - author: (string) the image author's username
    - date: (date) the timestamp the image was created
- response: 401
  - content-type: `application/json`
  - body: string
    - Access denied

```
$ curl -c cookie.txt
       http://localhost:3000/api/users/alice/images/
```

- description: retrieve a specific image file
- request: `GET /api/images/:id/`
- response: 200
  - content-type: `image/*`
- response: 401
  - content-type: `application/json`
  - body: string
    - Access denied
- response: 404
  - body: Image ID: :id does not exist

```
$ curl -c cookie.txt
       http://localhost:3000/api/images/KsQKbxF6jnZgfOan/
```
***
### Delete

- description: delete a specific image
- request: `DELETE /api/images/:id`
- response: 200
  - content-type: `application/json`
  - body: object
    - _id: (string) the image id
    - title: (string) the title of the image
    - author: (string) the image author's username
    - date: (date) the timestamp the image was created
- response: 401
  - content-type: `application/json`
  - body: string
    - Access denied
- response: 403
  - body: Forbidden
- response: 404
  - body: Image ID: :id does not exist

```
$ curl -X DELETE
       -c cookie.txt
       http://localhost:3000/api/images/KsQKbxF6jnZgfOan/
```
***
## Comment API
***
### Create

- description: create a new comment
- request: `POST /api/comments/`
  - content-type: `application/json`
  - body: object
    - content: (string) the content of the comment
    - imageId: (string) the image id
- response: 200
  - content-type: `application/json`
  - body: object
    - _id: (string) the comment id
    - imageId: (string) the image id
    - author: (string) the comment author's username
    - content: (string) the content of the comment
    - date: (date) the timestamp the comment was created
- response: 401
  - content-type: `application/json`
  - body: string
    - Access denied
- response: 404
  - body: Image ID: :id does not exist

```
$ curl -X POST
       -H "Content-Type: `application/json`"
       -d '{"content":"i like rainbow unicorns", "imageId":"KsQKbxF6jnZgfOan"}
       -c cookie.txt
       http://localhost:3000/api/comments/
```
***
### Read

- description: retrieve all comments for a specific image
- request: `GET /api/:id/comments/`
- response: 200
  - content-type: `application/json`
  - body: list of objects
    - _id: (string) the comment id
    - imageId: (string) the image id
    - author: (string) the comment author's username
    - content: (string) the content of the comment
    - date: (date) the timestamp the comment was created
- response: 401
  - content-type: `application/json`
  - body: string
    - Access denied
- response: 404
  - body: Image ID: :id does not exist

```
$ curl -c cookie.txt
       http://localhost:3000/api/XQPeSYSk2pSqST8V/comments/
```
***
### Delete

- description: delete a specific comment
- request: `DELETE /api/comments/:id/`
- response: 200
  - content-type: `application/json`
  - body: object
    - _id: (string) the comment id
    - imageId: (string) the image id
    - author: (string) the comment author's username
    - content: (string) the content of the comment
    - date: (date) the timestamp the comment was created
- response: 401
  - content-type: `application/json`
  - body: string
    - Access denied
- response: 403
  - body: Forbidden
- response: 404
  - body: Comment ID: :id does not exist

```
$ curl -X DELETE
       -c cookie.txt
       http://localhost:3000/api/comments/XQPeSYSk2pSqST8V/
```
***
## User API
***
### Read

- description: retrieve all users
- request: `GET /api/users/`
- response: 200
  - content-type: `application/json`
  - body: list of objects
    - _id: (string) the users' username
- response: 401
  - content-type: `application/json`
  - body: string
    - Access denied

```
$ curl -c cookie.txt
       http://localhost:3000/api/users/
```