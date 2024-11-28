## JSON Schemas

In this folder there are the JSON Schemas of film, review and user.

I started from the solution of lab01 and I added two more fields in the schema of the review:
- `delegated`: it is an integer that can have three different values:
    * **0**: The review has not been delegated to anyone
    * **1**: The reviewer has delegated the review to someone else
    * **2**: The review has been delegated from the original owner of the review
- `delegator`: it is an integer that can have the id of the review owner who delegated the review to another reviewer. This field is not null only if *delegated* is equal to 2

I modified the dependecies in case of `completed = false`: now it is possible to have reviews partially completed, so I can have completed = false with rating = 2 and some text in reviews.
I added in the dependecies the field `delegated`, so if it is equal to 0 or 1, *delegator* must be null or if it is equal to 2 *delegator* must containt the id of a user.