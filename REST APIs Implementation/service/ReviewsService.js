'use strict';

const Review = require('../components/review');
const User = require('../components/user');
const db = require('../components/db');
var constants = require('../utils/constants.js');


/**
 * Retrieve the reviews of the film with ID filmId
 * 
 * Input: 
 * - req: the request of the user
 * Output:
 * - list of the reviews
 * 
 **/
 exports.getFilmReviews = function(req) {
  return new Promise((resolve, reject) => {
      var sql = "SELECT r.filmId as fid, r.reviewerId as rid, completed, reviewDate, rating, review, delegated, delegator, c.total_rows FROM reviews r, (SELECT count(*) total_rows FROM reviews l WHERE l.filmId = ? ) c WHERE  r.filmId = ? ";
      var params = getPagination(req);
      if (params.length != 2) sql = sql + " LIMIT ?,?";
      db.all(sql, params, (err, rows) => {
          if (err) {
              reject(err);
          } else {
              let reviews = rows.map((row) => createReview(row));
              resolve(reviews);
          }
      });
  });
}

/**
 * Retrieve the number of reviews of the film with ID filmId
 * 
 * Input: 
* - filmId: the ID of the film whose reviews need to be retrieved
 * Output:
 * - total number of reviews of the film with ID filmId
 * 
 **/
 exports.getFilmReviewsTotal = function(filmId) {
  return new Promise((resolve, reject) => {
      var sqlNumOfReviews = "SELECT count(*) total FROM reviews WHERE filmId = ? ";
      db.get(sqlNumOfReviews, [filmId], (err, size) => {
          if (err) {
              reject(err);
          } else {
              resolve(size.total);
          }
      });
  });
}



/**
 * Retrieve the review of the film having filmId as ID and issued to user with reviewerId as ID
 *
 * Input: 
 * - filmId: the ID of the film whose review needs to be retrieved
 * - reviewerId: the ID ot the reviewer
 * Output:
 * - the requested review
 * 
 **/
 exports.getSingleReview = function(filmId, reviewerId) {
  return new Promise((resolve, reject) => {
      const sql = "SELECT filmId as fid, reviewerId as rid, completed, reviewDate, rating, review, delegated, delegator FROM reviews WHERE ((filmId = ? AND reviewerId = ?) OR (filmId = ? AND delegator = ?)) AND delegated <> 1";
      db.all(sql, [filmId, reviewerId, filmId, reviewerId], (err, rows) => {
          if (err)
              reject(err);
          else if (rows.length === 0)
              reject(404);
          else {
              var review = createReview(rows[0]);
              resolve(review);
          }
      });
  });
}


/**
 * Delete a review invitation
 *
 * Input: 
 * - filmId: ID of the film
 * - reviewerId: ID of the reviewer
 * - owner : ID of user who wants to remove the review
 * Output:
 * - no response expected for this operation
 * 
 **/
 exports.deleteSingleReview = function(filmId, reviewerId, owner) {
  return new Promise((resolve, reject) => {
    const sql1 = "SELECT f.owner, r.completed, r.delegator FROM films f, reviews r WHERE f.id = r.filmId AND ((f.id = ? AND r.reviewerId = ?) OR (f.id = ? AND r.delegator = ?))";
    db.all(sql1, [filmId, reviewerId, filmId, reviewerId], (err, rows) => {
        if(err) {
            reject(err);
        } else if(rows.length === 0) {
            reject(404);
        } else if(owner != rows[0].owner) {
            reject("403");
        } else if(rows.length === 1 && rows[0].delegator != null) {  // With this check I forbid to delete a delegation insteead the original review (with also the delegation)
            reject(403);
        } else if(rows.length === 1 && rows[0].completed == 1) {  // With this check I send a message error for completed review (no delegated)
            reject("409");
        } else if(rows.length === 2 && (rows[0].completed == 1 || rows[1].completed == 1)) { // With this check I send a message error for delegated reviews
            reject(409);
        } else {
            const sql2 = 'DELETE FROM reviews WHERE (filmId = ? AND reviewerId = ?) OR (filmId = ? AND delegator = ?)';

            db.run(sql2, [filmId, reviewerId, filmId, reviewerId], (err) => {
            if(err) {
                console.log("Sql2 delete: ", err);
                reject(err);
            } else
                resolve(null);
            })
        }
    });
  });
}



/**
 * Issue a film review to a user
 *
 *
 * Input: 
 * - reviewerId : ID of the film reviewer
 * - filmId: ID of the film 
 * - owner: ID of the user who wants to issue the review
 * Output:
 * - no response expected for this operation
 * 
 **/
 exports.issueFilmReview = function(invitations,owner) {
    // console.log(invitations)
    return new Promise((resolve, reject) => {
      const sql1 = "SELECT owner, private FROM films WHERE id = ?";
      db.all(sql1, [invitations[0].filmId], (err, rows) => {
          if (err){
                reject(err);
          }
          else if (rows.length === 0){
              reject(404);
          }
          else if(owner != rows[0].owner) {
              reject(403);
          } else if(rows[0].private == 1) {
              reject(404);
          }
          else {
            var sql2 = 'SELECT * FROM users' ;
            var invitedUsers = [];
            for (var i = 0; i < invitations.length; i++) {
                // console.log(invitations[i]);
                if(i == 0) sql2 += ' WHERE id = ?';
                else sql2 += ' OR id = ?'
                invitedUsers[i] = invitations[i].reviewerId;
            }
            db.all(sql2, invitedUsers, async function(err, rows) {
                if (err) {
                    reject(err);
                } 
                else if (rows.length !== invitations.length){
                    reject(409);
                }
                else {
                    const sql3 = 'INSERT INTO reviews(filmId, reviewerId, completed) VALUES(?,?,0)';
                    var finalResult = [];
                    for (var i = 0; i < invitations.length; i++) {
                        var singleResult;
                        try {
                            singleResult = await issueSingleReview(sql3, invitations[i].filmId, invitations[i].reviewerId);
                            finalResult[i] = singleResult;
                        } catch (error) {
                            reject ('Error in the creation of the review data structure');
                            break;
                        }
                    }

                    if(finalResult.length !== 0){
                        resolve(finalResult);
                    }        
                }
            }); 
          }
      });
  });
}

const issueSingleReview = function(sql3, filmId, reviewerId){
    return new Promise((resolve, reject) => {
        db.run(sql3, [filmId, reviewerId], function(err) {
            if (err) {
                reject('500');
            } else {
                var createdReview = new Review(filmId, reviewerId, false);
                resolve(createdReview);
            }
        });
    })
}

/**
 * Complete and update a review
 *
 * Input:
 * - review: review object (with only the needed properties)
 * - filmID: the ID of the film to be reviewed
 * - reviewerId: the ID of the reviewer
 * Output:
 * - no response expected for this operation
 * 
 **/
 exports.updateSingleReview = function(review, filmId, reviewerId) {
    return new Promise((resolve, reject) => {

        const sql1 = "SELECT * FROM reviews WHERE filmId = ? AND reviewerId = ?";
        db.all(sql1, [filmId, reviewerId], (err, rows) => {
            if(err)
                reject(err);
            else if (rows.length === 0)
                reject(404);
            else if(reviewerId != rows[0].reviewerId) {
                reject(403);
            } else if(rows[0].delegated == 1) {
                reject(409);
            } else {
                const currentReview = rows[0];
                const isCompleted = currentReview.completed === 1;

                // I check if the current review is completed or not
                if(isCompleted) {
                    reject("409"); 
                    return;
                }

                var sql2 = 'UPDATE reviews SET completed = ?';
                var parameters = [];

                // I check if completed is inserted, if not I put false 
                // by default, because it means you don't want to complete the review yet
                if(review.completed != undefined) {
                    if(review.completed == true) {
                        if(rows[0].rating == undefined && review.rating == undefined) {
                            reject(400);
                            return;
                        } else if(rows[0].review == null && review.review == undefined) {
                            reject(400);
                            return;
                        } else if(rows[0].reviewDate == null && review.reviewDate == undefined) {
                            reject(400);
                            return;
                        }
                    }
                    parameters.push(review.completed);
                } else {
                    parameters.push(false);
                }

                if(review.reviewDate != undefined) {
                    sql2 = sql2.concat(', reviewDate = ?');
                    parameters.push(review.reviewDate);
                } 

                if(review.rating != undefined) {
                    if(review.rating < 1 || review.rating > 10) {
                        reject("400");
                        return;
                    }
                    sql2 = sql2.concat(', rating = ?');
                    parameters.push(review.rating);
                } 

                if(review.review != undefined) {
                    sql2 = sql2.concat(', review = ?');
                    parameters.push(review.review);
                } 
                sql2 = sql2.concat(' WHERE filmId = ? AND reviewerId = ?');
                parameters.push(filmId);
                parameters.push(reviewerId);

                db.run(sql2, parameters, function(err) {
                    if (err) {
                        reject(err);
                    } else {
                    resolve(null);
                    }
                })
            }
        });
    });
}

/**
 * Delegate a review 
 *
 * Input: 
 * - filmId: ID of the film
 * - delegator: ID of the reviewer that is delegating the review
 * - delegatedUser : ID of the user to whom the review has been delegated
 * Output:
 * - no response expected for this operation
 * 
 **/
exports.delegateReview = function(filmId, delegator, delegatedUser) {
    return new Promise((resolve, reject) => {
        const sql1 = "SELECT * FROM reviews r WHERE r.filmId = ? AND r.reviewerId = ?";
        db.all(sql1, [filmId, delegator], (err, rows) => {
            if(err) {
                reject(err);
            } else if(rows.length === 0) {
                reject(404);
            } else if(rows[0].completed == 1) {     // I can't delegate a review if it has been completed
                reject("409");
            } else if(rows[0].delegated == 1) {     // I can't delegate a review if it has already been delegated
                reject(409);
            } else if(rows[0].delegated == 2) {     // I can't delegate a review if I'm the one to whom the review has been delegated 
                reject(409);
            } else {
                const originalReview = rows[0];
                const del = 1;

                const sql2 = 'UPDATE reviews SET delegated = ? WHERE filmId = ? AND reviewerId = ?';

                db.run(sql2, [ del, filmId, delegator ], function(err) {
                    if(err) {
                        reject(err);
                    } else {
                        const sql3 = 'INSERT INTO reviews(filmId, reviewerId, completed, reviewDate, rating, review, delegated, delegator) VALUES(?,?,0,?,?,?,2,?)';
                        db.run(sql3, [filmId, delegatedUser, originalReview.reviewDate, originalReview.rating, originalReview.review, delegator], (err) => {
                            if(err) {
                                reject(500);
                            } else {
                                const createdReview = new Review(filmId, delegatedUser, false, originalReview.reviewDate, originalReview.rating, originalReview.review, 2, delegator);
                                resolve(createdReview);
                            }
                        })
                    }
                })
            }
        });
    });  
}

/**
 * Delete a delegated review invitation
 *
 * Input: 
 * - filmId: ID of the film
 * - delegatedUser: ID of the reviewer that has been delegated
 * - delegator : ID of user who delegated the review and want to cancel it
 * Output:
 * - no response expected for this operation
 * 
 **/
exports.deleteDelegatedReview = function(filmId, delegatedUser, delegator) {
    return new Promise((resolve, reject) => {
        const sql1 = "SELECT r.completed, r.delegator FROM reviews r WHERE r.filmId = ? AND r.reviewerId = ?";

        db.all(sql1, [filmId, delegatedUser], (err, rows) => {
            if(err) {
                reject(err);
            } else if(rows.length === 0) {
                reject(404);
            }  else if(rows[0].delegator === null) {
                reject(403);
            } else if(delegator != rows[0].delegator) {
                reject("403");
            } else if(rows[0].completed == 1) {
                reject("409");
            } else {
                const sql2 = 'DELETE FROM reviews WHERE filmId = ? AND reviewerId = ?';
                db.run(sql2, [filmId, delegatedUser], (err) => {
                    if(err) {
                        reject(err);
                    } else {
                        const sql3 = 'UPDATE reviews SET delegated = ? WHERE filmId = ? AND reviewerId = ?';
                        const delegated = 0;

                        db.run(sql3, [delegated, filmId, delegator], (err) => {
                            if(err) {
                                console.log("sql3: ", err);
                                reject(500);
                            } else {
                                resolve(null);
                            }
                        })
                    }
                })
            }
        });
    });
}

/**
 * Utility functions
 */
 const getPagination = function(req) {
  var pageNo = parseInt(req.query.pageNo);
  var size = parseInt(constants.OFFSET);
  var limits = [];
  limits.push(req.params.filmId);
  limits.push(req.params.filmId);
  if (req.query.pageNo == null) {
      pageNo = 1;
  }
  limits.push(size * (pageNo - 1));
  limits.push(size);
  return limits;
}


const createReview = function(row) {
  var completedReview = (row.completed === 1) ? true : false;
  return new Review(row.fid, row.rid, completedReview, row.reviewDate, row.rating, row.review, row.delegated, row.delegator);
}