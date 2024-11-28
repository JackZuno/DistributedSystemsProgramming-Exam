class Review{    
    constructor(filmId, reviewerId, completed, reviewDate, rating, review, delegated, delegator) {
        this.filmId = filmId;
        this.reviewerId = reviewerId;
        this.completed = completed;

        if(reviewDate)
            this.reviewDate = reviewDate;
        if(rating)
            this.rating = rating;
        if(review)
            this.review = review;

        // Can be set to: 
        // 0 (no delegated), 
        // 1 (it has been delegated to someone else), 
        // 2 (It has been delegated from someone else)
        if(delegated)
            this.delegated = delegated;
        
        // Delegator is the id of the reviewer who delegated the review
        if(delegator)
            this.delegator = delegator;

        var selfLink = "/api/films/public/" + this.filmId + "/reviews/" + this.reviewerId;
        this.self =  selfLink;
    }
}

module.exports = Review;


