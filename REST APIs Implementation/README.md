## REST APIs Implementation

I used, as a starting point, the solution provided for lab01, then I made some changes and added some functions to satisfy the requirements of the Exam Assignment.

### How to run the code
- `Rest APIs Implementation folder`: enter in the folder containing the code, in this case is the *Rest APIs Implementation*
- `npm install`: to install all the node_modules
- `npm start`: to run the code
- `Test the code`: you can test the functionalities using postman or Swagger-ui (which, in this case, will be available on http://localhost:3001/docs)

### Main Changes and Desing Choices
- `getFilmReviews`: I retrieve all the reviews for a given film. In case of delegated review, I will return the original review (with a field delegated equal to 1 which means that has been delegated to someone) and the delegated review (with a field delegated equal to 2, which means that has been delegated from someone, and the field delegator which tells
who delegated this review)
- `getSingleReview`: I retrieve only one review, so in case of a delegated review and an original review, the one that is returned is the delegated review with both fields, delegated and delegator
- `deleteSingleReview`: In this case I check:
    - if I'm deleting a delegated review and not the original one => return an error
    - if I'm deleting a review which has a delegated review that has been completed => I return an error (I kept the check that was in the solution of lab01, where there was a check if the review was completed or not, and I extended this control to the delegated review)
    - if I'm deleting a review which has been completed => I return an error 
    - If everything is okay:
        - I delete the review 
        - if present, also the delegated review will be deleted
- `updateSingleReview`: The decision on if a review can be updated or not is based on the *completed* fields (it MUST be false) and on the *delegated* value:
    - delegated = 0: I can update the review without problems
    - delegated = 1: I cannot update the review because this review has been delegated, so I must keep this unchanged. I can modify only the delegated one
    - delegated = 2: I can update the delegated review and keep the original review unchanged
- `delegateReview`: A review can be delegated if it has not been already delegated (to someone or from someone, so *delegated = 0*) and if it has not been completed. A review cannot delegated a review to itself
- `deleteDelegatedReview`: Delete a delegation only if the review has not been completed
- `table reviews (db)`: I added two new columns:
    - *delegated*: the default value is 0 and it can contain three different values:
        - 0 : it means that the review has not been delegated
        - 1 : it means that the review has been delegated to another user from the original one
        - 2 : it means that the review has been delegated from the original user to the current one
    - *delegator*: the default value is null and it can contain the id of the reviewer who delegated the review to the current reviewer (**only if delegated=2**)

### Users Credentials

Here you can find a list of the users already registered inside the provided database.

|         email               | plain-text password |
|-----------------------------|---------------------|
| user.dsp@polito.it          | password            |
| frank.stein@polito.it       | shelley97           |
| karen.makise@polito.it      | fg204v213           |
| rene.regeay@polito.it       | historia            |
| beatrice.golden@polito.it   | seagulls            |
| arthur.pendragon@polito.it  | holygrail           |