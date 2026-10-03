const tweets = {}

const likeTweet = (tweetId) => {
    const randomLikes = Math.floor(Math.random() * 10) + 1;
    simulateLikes(tweetId, randomLikes)

    if (tweets[tweetId]) {
        tweets[tweetId].likes += 1
    } else {
        tweets[tweetId] = { likes: 1 }
    }
}

const getLikes = (tweetId) => {
    return tweets[tweetId] ? tweets[tweetId].likes : 0
}

const simulateLikes = (tweetId, numLikes) => {
    for (let i = 0; i < numLikes; i++) {
        likeTweet(tweetId)
    }
}