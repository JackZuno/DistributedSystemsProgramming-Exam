## REST APIs Design

### Examples of JSON documents

#### Login
```
{
  "$schema": "string",
  "email": "user.dsp@polito.it",
  "password": "password"
}
```

#### Create private film
```
{
  "$schema": "string",
  "id": 0,
  "title": "Private Film generated with Postman",
  "owner": 0,
  "private": true,
  "watchDate": "2024-01-31",
  "rating": 7,
  "favorite": true
}
```

#### Update private film
The parameter is passed here: /api/films/private/12.
12 is the filmId.
```
{
  "$schema": "string",
  "id": 0,
  "title": "New Title for the film created with Postman",
  "owner": 0,
  "private": true,
  "watchDate": "2024-01-14",
  "rating": 5,
  "favorite": false
}
```

#### Update private film (error)
The parameter is passed here: /api/films/private/12.
12 is the filmId.
In this case I am trying to change the visibility of a film (private = false).
```
{
  "$schema": "string",
  "id": 0,
  "title": "New Title for the film created with Postman",
  "owner": 0,
  "private": false,
  "watchDate": "2024-01-14",
  "rating": 5,
  "favorite": false
}
```

#### Create public film
```
{
  "$schema": "string",
  "id": 0,
  "title": "Public Film generated with Postman",
  "owner": 0,
  "private": false
}
```

#### Update public film
The parameter is passed here: /api/films/public/13.
13 is the filmId.
```
{
  "$schema": "string",
  "id": 0,
  "title": "New title for the public film created with postman",
  "owner": 0,
  "private": false
}
```

#### Update public film (error)
The parameter is passed here: /api/films/public/13.
13 is the filmId.
In this case I am trying to change the visibility of a film (private = true).

```
{
  "$schema": "string",
  "id": 0,
  "title": "New title for the public film created with postman",
  "owner": 0,
  "private": true
}
```

#### Issue a film review
The parameters are passed here: /api/films/public/11/reviews.
11 is the filmId.
```
[
  {
    "$schema": "string",
    "filmId": 11,
    "reviewerId": 5
  },
  {
    "$schema": "string",
    "filmId": 11,
    "reviewerId": 3
  },
  {
    "$schema": "string",
    "filmId": 11,
    "reviewerId": 1
  }
]
```

#### Update a review
The parameters are passed here: /api/films/public/11/reviews/1.
11 is the filmId, while 1 is the reviewerId.
```
{
  "$schema": "string",
  "reviewDate": "2024-02-01"
}
```

#### Update a review (all fields are filled)
The parameters are passed here: /api/films/public/11/reviews/1.
11 is the filmId, while 1 is the reviewerId.
Here completed is still false, because is the JSON I used in Postman, as an example, so this review will be deleted in the future. If I set completed = true, the review cannot be deleted anymore.
```
{
  "$schema": "string",
  "completed": false,
  "rating": 5,
  "review": "Could be better"
}
```

### Examples of JSON response

#### Get single private film
```
{
    "id": 1,
    "title": "Your Name",
    "owner": 1,
    "private": true,
    "watchDate": "2021-10-03",
    "rating": 9,
    "favorite": true,
    "self": "/api/films/private/1"
}
```

#### Get private films
```
{
    "totalPages": 1,
    "currentPage": 1,
    "totalItems": 2,
    "films": [
        {
            "id": 1,
            "title": "Your Name",
            "owner": 1,
            "private": true,
            "watchDate": "2021-10-03",
            "rating": 9,
            "favorite": true,
            "self": "/api/films/private/1"
        },
        {
            "id": 4,
            "title": "Weathering with You",
            "owner": 1,
            "private": true,
            "self": "/api/films/private/4"
        }
    ]
}
```

#### Get single public films
```
{
    "id": 3,
    "title": "You Can (Not) Redo",
    "owner": 1,
    "private": false,
    "self": "/api/films/public/3",
    "reviews": "/api/films/public/3/reviews"
}
```

#### Get public films
```
{
    "totalPages": 3,
    "currentPage": 1,
    "totalItems": 6,
    "films": [
        {
            "id": 2,
            "title": "Heaven's Feel",
            "owner": 2,
            "private": false,
            "self": "/api/films/public/2",
            "reviews": "/api/films/public/2/reviews"
        },
        {
            "id": 3,
            "title": "You Can (Not) Redo",
            "owner": 1,
            "private": false,
            "self": "/api/films/public/3",
            "reviews": "/api/films/public/3/reviews"
        }
    ],
    "next": "/api/films/public?pageNo=2"
}
```

#### Get invited films
```
{
    "totalPages": 2,
    "currentPage": 1,
    "totalItems": 3,
    "films": [
        {
            "id": 3,
            "title": "You Can (Not) Redo",
            "owner": 1,
            "private": false,
            "self": "/api/films/public/3",
            "reviews": "/api/films/public/3/reviews"
        },
        {
            "id": 6,
            "title": "Spirited Away",
            "owner": 5,
            "private": false,
            "self": "/api/films/public/6",
            "reviews": "/api/films/public/6/reviews"
        }
    ],
    "next": "/api/films/public/invited?pageNo=2"
}
```

#### Get film reviews
In case of the presence of delegated reviews, the output will contain both reviews.
```
{
    "totalPages": 2,
    "currentPage": 1,
    "totalItems": 3,
    "reviews": [
        {
            "filmId": 9,
            "reviewerId": 1,
            "completed": true,
            "reviewDate": "2024-01-29",
            "rating": 5,
            "review": "HEY, now it is completed",
            "delegated": 2,
            "delegator": 4,
            "self": "/api/films/public/9/reviews/1"
        },
        {
            "filmId": 9,
            "reviewerId": 4,
            "completed": false,
            "review": "I'm testing delegating stuff",
            "delegated": 1,
            "self": "/api/films/public/9/reviews/4"
        }
    ],
    "next": "/api/films/public/undefined?pageNo=2"
}
```

#### Get single review
There is no delegation related to this review.
```
{
    "filmId": 9,
    "reviewerId": 5,
    "completed": true,
    "reviewDate": "2022-04-04",
    "rating": 9,
    "review": "Even if the film is short, it provides a deep characterizaition for the two main characters.",
    "self": "/api/films/public/9/reviews/5"
}
```

#### Get single review (delegated review)
The review has been delegated.
- reviewerId: id of the user to whom the review has been delegated
- delegated: 2 => this is a delegated review (the reviewer is not the original reviewer)
- delegator: id of the original reviewer, who is the one who delegated the review 
```
{
    "filmId": 9,
    "reviewerId": 1,
    "completed": true,
    "reviewDate": "2024-01-29",
    "rating": 5,
    "review": "HEY, now it is completed",
    "delegated": 2,
    "delegator": 4,
    "self": "/api/films/public/9/reviews/1"
}
```