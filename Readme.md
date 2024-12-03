# A project with Chai Aur Backend.

## Subscription schema:-

### there are two data : Subscriber and channel
#### We can't make an array in the Subsciption model called subscribers and pass the id's of the subscribers , cause that will be a very expensive operation on its own as subcribers can be in millions.

#### Instead we would be making documents consisting of two key and value: which will be : Subscriber & Channel
#### In the Channel , we would store the channel that has been subscribed and in the Subscriber, we would store the user that subscribed the channel.
#### for ex: if channel ChaiAurCode gets subscribed by aMysteriousUser then >> Subscriber: aMysteriousUser, Channel: ChaiAurCode.
#### And this will be concluding 1 document, and every time a channel gets subscribed a new document will be getting created, hence to get how many subscribers someone has -- we'll just have to count the documents consisting their name as "Channel".
#### And to see how many channels they have subscribed -- we'll just have to count the document consisting their name as "Subscriber".