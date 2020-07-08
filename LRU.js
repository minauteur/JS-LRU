/* 
In Javascript, to keep all operations O(1), a combination of data structures are required:
First, We need to mimic the behavior of a Doubly Linked List (for write/remove operations) 
Then, we use Map(Object) (for reading)
to begin, we define a Node structure for the items our Doubly Linked List will contain
*/
class Node {
	constructor(key, value, next = null, prev = null) {
		this.key = key;
		this.value = value;
		this.next = next;
		this.prev = prev;
	}
}
/*
LRU is an initialism of "Least Recently Used".
"Used" here means any operation, so any time an item is written, read, or updated.
Our List structure will help us preserve that information by bubbling any "used" items to the top or "head"
In this way, the least recently used item is guaranteed to be at the tail of the list, and thus, removed if/when necessary.
A new LRU() takes one optional argument, limit: an integer value representing the maximum number of items the cache may hold.
(because an unbounded cache is effectively useless, it's best to include a default value in case none is provided)
To enforce the cap when writing to the cache, we check this.size against this.limit.
If this.size === this.limit, we remove the tail from the list before writing.
Because writing is an operation (ie "usage"), we shift the current head of the list when we write,
and then set this.head equal to the node to be written.
We can then re-use our remove and write logic to implement the same behavior in our read method, ensuring that read items 
are moved appropriately to the head of the list.
meanwhile, we'll store a key:node relationship in our Cache Map so that retrieval remains O(1) 
*/
class LRU {
	constructor(limit = 3) {
		this.size = 0;
		this.limit = limit;
		this.head = null;
		this.tail = null;
		this.cache = {};
	}
	/*
enforceLimit checks size against limit, removing the least recently used item if necessary 
	*/
	enforceLimit() {
		if (this.limit === this.size) {
			this.remove(this.tail.key);
		}
	}
	/*
First, we check the limit of the cache and enforce it if necessary.
If the head doesn't exist, then we've got our first item so head = tail = node.
Otherwise we create a new node, passing a reference to the current head
before setting head equal to the new node we're writing.
	*/
	add(key, value) {
		this.enforceLimit();
		if (!this.head) {
			this.head = this.tail = new Node(key, value);
		} else {
			const node = new Node(key, value, this.head);
			this.head.prev = node;
			this.head = node;
		}
		/*
Finally, we update the value in our cache map and increment our size.
This implementation silently overwrites--we can manually check for
the key's existence in the cache prior to writing if we care about that
		*/
		this.cache[key] = this.head;
		this.size++;
	}
	/*
remove takes a key and removes the node from the list, updates any adjacent node(s),
and deletes corresponding entries from our cache map
before removing a node from our list, we want to move any existing references from "next" and "prev"
to the previous and next nodes respectively to preserve the list's order, unless either is null.
if either prev and/or next is null, we set the values for head and tail equal to next and prev--again respectively.
	*/
	remove(key) {
		const node = this.cache[key];
		if (node != null) {
			/*
if the next value on the current node is non-null, set its prev value equal to the prev value of the node to be removed
			*/
			if (node.next != null) {
				node.next.prev = node.prev;
			} else {
				/*
otherwise if the node to-be-removed's next value is null, then set the tail equal to prev of our current node.
similarly to how we set the head, we don't care if node.prev was already null--that just means we're emptying the list.
if the node to-be-removed has a non-null value for next, we ensure that the tail remains in place by setting the tail
equal to that value
				*/
				this.tail = node.prev;
			}
			/*
if the node to be removed has a non-null value for prev, set the next value of the previous node (prev is referencing)
equal to the next value of the node to-be-removed.
			*/
			if (node.prev != null) {
				node.prev.next = node.next;
			} else {
			/*
otherwise, if the node to be removed has a null value for prev:
the node to-be-removed is either already the first (and possibly ONLY) item in the list (so this.head === node.next === null)
or else the node to-be-removed's next value becomes the new head node.
			*/
				this.head = node.next;
			}
			/*
having satisfied the necessary conditions for preserving the order of our list upon removal of the node, we delete the key
from our map (explicitly--not via the 'node' reference) and decrement the size of the cache to complete the remove operation
			*/
			delete this.cache[key];
			this.size--;
		} else {
			return null;
		}
	}
	/*
read checks the cache map for the existence of the key in our map:
if it exists, read returns the value and sets head equal to the corresponding node,
if not, we return null.
	*/
	read(key) {
		if (this.cache[key]) {
			const value = this.cache[key].value;
			this.remove(key);
			this.add(key, value);
			return value;
		}
		return null;
	}
	/*
this is an unnecessary function for an actual LRU cache/memoization implementation--I just wanted a dead simple way for users to return
all of the list content very easily for learning.
	*/
	contentsArray() {
		const valueList = [this.head.value];
		let node = this.head.next;
		while (node != null) {
			valueList.push(node.value);
			node = node.next;
		}
		return valueList;
	}
}
/*
here is our rather generic memoization implementation. 
*/
const memoizedLRU = function (otherFunc) {
	const memo = new LRU(3);
	return function (args) {
		const argsList = Array.from(arguments);
		const key = JSON.stringify(argsList);
		const itemExists = memo.read(key);
		if (!itemExists) {
			const value = otherFunc(...argsList);
			memo.add(key, value);
			// console.log("Not in cache! calling \n" + otherFunc + "\nwith args: " + JSON.stringify(argsList))
			return value;
		} else {
			// console.log("In cache! returning "+itemExists)
			return itemExists;
		}
	};
};
/*
Here is an example of interacting with the LRU directly.
*/
const lru = new LRU(5);
lru.add(1, "foo");
lru.add(2, "bar");
lru.add(3, "baz");
lru.add(4, "foobar");
lru.add(5, "hello");
lru.add(6, "world");
console.log("lru.read(2) = " + lru.read(2));
console.log("lru.read(1) = " + lru.read(1));
console.log(lru.tail.value);
console.log(lru.head.value);
console.log(lru.contentsArray().join(" "));
/*
here are two functions for example memoization
*/
function addXY(x, y) {
	return x + y;
}
function addN(params) {
	let res = 0;
	const args = arguments;
	for (let i = 0; i < args.length; i++) {
		let arg = args[i];
		res = res + arg;
	}
	return res;
}
/*
syntax/structure for initializing the memo/cache;
*/
const memoizedAddXY = memoizedLRU(function (x, y) {
	return addXY(x, y);
});
const memoizedAddN = memoizedLRU(function () {
	return addN(...Array.from(arguments));
});
/*
example calls for testing generic functionality;
to confirm the values are being computed/returned from the cache respectively, 
uncomment the calls to console.log() on lines 129 and 133.
*/
console.log("calling memoizedAddXY(1,2) twice...");
console.log(
	"...should call memoizedAddXY(1, 2), write 3 to the cache and then return it: " +
		memoizedAddXY(1, 2)
);
console.log("...should return 3 from cache directly: " + memoizedAddXY(1, 2));
console.log("calling memoizedAddN(1,2,3) twice...");
console.log(
	"...should call memoizedAddN(1, 2, 3), write 6 to the cache and then return it: " +
		memoizedAddN(1, 2, 3)
);
console.log("...should return 6 from cache directly: " + memoizedAddN(1, 2, 3));
