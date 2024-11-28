'use strict';

var utils = require('../utils/writer.js');
var Reviews = require('../service/ReviewsService');
var constants = require('../utils/constants.js');

module.exports.getFilmReviews = function getFilmReviews (req, res, next) {
    var numOfReviews = 0;
    var next=0;

    Reviews.getFilmReviewsTotal(req.params.filmId)
        .then(function(response) {
          
            numOfReviews = response;
            Reviews.getFilmReviews(req)
            .then(function(response) {
                if (req.query.pageNo == null) var pageNo = 1;
                else var pageNo = req.query.pageNo;
                var totalPage=Math.ceil(numOfReviews / constants.OFFSET);
                next = Number(pageNo) + 1;
                if (pageNo>totalPage) {
                    utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': "The page does not exist." }], }, 404);
                } else if (pageNo == totalPage) {
                    utils.writeJson(res, {
                        totalPages: totalPage,
                        currentPage: pageNo,
                        totalItems: numOfReviews,
                        reviews: response
                    });
                } else {
                    utils.writeJson(res, {
                        totalPages: totalPage,
                        currentPage: pageNo,
                        totalItems: numOfReviews,
                        reviews: response,
                        next: "/api/films/public/" + req.params.taskId +"?pageNo=" + next
                    });
                }
        })
        .catch(function(response) {
            utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
        });
        })
        .catch(function(response) {
          utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
      });
  
};

module.exports.getSingleReview = function getSingleReview (req, res, next) {

    Reviews.getSingleReview(req.params.filmId, req.params.reviewerId)
        .then(function(response) {
            utils.writeJson(res, response);
        })
        .catch(function(response) {
            if (response == 404){
                utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The review does not exist.' }], }, 404);
            }
            else {
                utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
            }
        });
};

module.exports.deleteSingleReview = function deleteSingleReview (req, res, next) {
  Reviews.deleteSingleReview(req.params.filmId, req.params.reviewerId, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response, 204);
    })
    .catch(function (response) {
      if(response === "403") {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The user is not the owner of the film' }], }, 403);
      } else if(response === 403) {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'This is a delegated review. Delete the original one.' }], }, 403);
      } else if(response === "409") {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The review has been already completed, so the invitation cannot be deleted anymore.' }], }, 409);
      } else if(response === 409) {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The delegated review has been already completed, so the invitation cannot be deleted anymore.' }], }, 409);
      } else if (response == 404) {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The review does not exist.' }], }, 404);
      } else {
        utils.writeJson(res, {errors: [{ 'param': 'Server', 'msg': response }],}, 500);
      }
    });
};

module.exports.issueFilmReview = function issueFilmReview (req, res, next) {
  var differentFilm = false;
  for(var i = 0; i < req.body.length; i++){
    if(req.params.filmId != req.body[i].filmId){
      differentFilm = true;
    }
  }
  if(differentFilm){
    utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The filmId field of the review object is different from the filmdId path parameter.' }], }, 409);
  }
  else {
    Reviews.issueFilmReview(req.body, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response, 201);
    })
    .catch(function (response) {
      if(response == 403){
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The user is not the owner of the film' }], }, 403);
      }
      else if (response == 404){
          utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The public film does not exist.' }], }, 404);
      }
      else if (response == 409){
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The user with ID reviewerId does not exist.' }], }, 404);
      }
      else {
          utils.writeJson(res, {errors: [{ 'param': 'Server', 'msg': response }],}, 500);
      }
    });
  }
};

// Add a check when I want to set complete=true
// In that case, all the fields (rating, review and reviewDate) should be filled
module.exports.updateSingleReview = function updateSingleReview (req, res, next) {
  if(req.params.reviewerId != req.user.id) {
    utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The reviewerId is not equal the id of the requesting user.' }], }, 400);
  } else {
    Reviews.updateSingleReview(req.body, req.params.filmId, req.params.reviewerId)
    .then(function(response) {
        utils.writeJson(res, response, 204);
    })
    .catch(function(response) {
      if(response === "409") {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'Review is already completed. No further modification are possible' }], }, 409);
      } else if(response === 400) {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'When completed is set to true, all the fields should be filled (rating, review, reviewDate)' }], }, 400);
      } else if(response === "400") {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'Bad value for rating (0 < rating <= 10)' }], }, 400);
      } else if(response == 403) {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The user is not a reviewer of the film' }], }, 403);
      } else if (response == 404) {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The review does not exist.' }], }, 404);
      } else if(response === 409) {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'This review has been delegated. Only the delegated user can modify it.' }], }, 409);
      } else {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
      }
    });
  }
};

module.exports.delegateReview = function delegateReview (req, res, next) {
  if(req.params.reviewerId == req.user.id) {
    utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The reviewer is delegating the review to itself.' }], }, 400);
  } else {
    // Parameters of the function: filmId, delegator, delegatedUser
    Reviews.delegateReview(req.params.filmId, req.user.id, req.params.reviewerId)
    .then(function (response) {
      utils.writeJson(res, response, 204);
    })
    .catch(function (response) {
      if(response === "403") {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The user is not the owner of the review' }], }, 403);
      } else if(response === "409") {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The review has been already completed, so no delegation is possible.' }], }, 409);
      } else if(response === 409) {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The review has been already delegated.' }], }, 409);
      } else if(response == 404) {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The review does not exist.' }], }, 404);
      } else {
        utils.writeJson(res, {errors: [{ 'param': 'Server', 'msg': response }],}, 500);
      }
    });
  }
};

module.exports.deleteDelegatedReview = function deleteDelegatedReview (req, res, next) {
  // Parameters of the function: filmId, delegatedUser, delegator
  Reviews.deleteDelegatedReview(req.params.filmId, req.params.reviewerId, req.user.id)
  .then(function (response) {
    utils.writeJson(res, response, 204);
  })
  .catch(function (response) {
    if(response === "403"){
      utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The user is not the delegator' }], }, 403);
    } else if(response === 403){
      utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'There is no delegation associated to this review' }], }, 403);
    } else if(response == "409"){
      utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The review has been already completed, so the delegation cannot be deleted anymore.' }], }, 409);
    } else if (response == 404){
      utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The delegated review does not exist.' }], }, 404);
    } else {
      utils.writeJson(res, {errors: [{ 'param': 'Server', 'msg': response }],}, 500);
    }
  });
};