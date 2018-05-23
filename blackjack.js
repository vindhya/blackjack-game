const playerHand = []; // array to hold the human player's cards
const dealerHand = []; // array to hold the computer dealer's cards
const playAgainText = `<br><a href="blackjack.html">Play again?</a>`;

// creating an array of objects where each item object represents a card - 6 decks
let cards = (function() {
	// set up objects to be iterated through
	const cardSetup = [
		{ type: 'ace', value: 1, altValue: 11 },
		{ type: 'two', value: 2 },
		{ type: 'three', value: 3 },
		{ type: 'four', value: 4 },
		{ type: 'five', value: 5 },
		{ type: 'six', value: 6 },
		{ type: 'seven', value: 7 },
		{ type: 'eight', value: 8 },
		{ type: 'nine', value: 9 },
		{ type: 'ten', value: 10 },
		{ type: 'jack', value: 10 },
		{ type: 'queen', value: 10 },
		{ type: 'king', value: 10 }
	];
	// set up suits to be iterated through
	const suitSetup = ['spades', 'hearts', 'clubs', 'diamonds'];
	const cardsArray = [];

	// iterate the whole thing 6 times for 6 decks
	for (let i = 0; i < 6; i++) {
		// iterate through each card type
		cardSetup.forEach(card => {
			// iterate through each suit
			suitSetup.forEach(suit => {
				// push an object with the card's properties to the array
				cardsArray.push(
					{
						type: card.type,
						value: card.value,
						altValue: card.altValue,
						suit: suit,
						image: `images/PNG-cards-1.3/${card.type}_of_${suit}.png`
					}
				);
			});
		});
	}

	return cardsArray;
})();

// creating a tree data structure - eventually used to calculate count
function Node(value) {
	this.value = value;
	this.children = [];
	this.parent = null;
}
Node.prototype.getParentNode = function() {
	return this.parent;
}
Node.prototype.getChildren = function() {
	return this.children;
}
Node.prototype.setParentNode = function(node) {
	this.parent = node;
}
Node.prototype.addChild = function(node) {
	node.setParentNode(this);
	this.children[this.children.length] = node;
	return node;
}

// shuffle the items in the cards array
// could have used lodash or underscorejs shuffle argh!!!
function shuffle(cards) {
	cards.forEach((card, index) => {
		const randomIndex = Math.floor(Math.random() * cards.length);
		const hold = cards[index];
		cards[index] = cards[randomIndex];
		cards[randomIndex] = hold;
	});

	return cards;
}

// deal the initial cards to player and dealer
function initialDeal() {
	// iterate twice to deal 2 cards to each person
	for (let i = 0; i <= 1; i++) {
		playerHand.push(cards.pop()); // remove a card from cards array and add it to the player's hand
		dealerHand.push(cards.pop()); // remove a card from the cards array and add it to the dealer's hand
	}
}

// calculate the total value of hand passed in and return an array with the count totals
function grabCount(hand) {
	const root = new Node(0);
	const countArray = withoutDupes(sumValues(buildHandTree(root, hand), 0, []));

	// create a tree with the values in the hand
	function buildHandTree(node, hand) {
		
		// add the value of the card as a child to this node
		const child = node.addChild(new Node(hand[0].value));
		
		// if this isn't the last card in the hand, recursively call this function again
		if (hand[1] != undefined) {
			buildHandTree(child, hand.slice(1));
		}
		
		// if the item/card is an ace, we'll have to add another child to this node for the 11 altValue
		if (hand[0].type === 'ace') {
			const secondChild = node.addChild(new Node(hand[0].altValue));
		
			if (hand[1] != undefined) {
				buildHandTree(secondChild, hand.slice(1));
			}
		}

		return node;
	}

	// traverse the passed tree and return an array of the different counts
	function sumValues(node, count, arr) {
		count += node.value;
		// console.log('count', count);

		if (node.children.length < 1) { // if the node is a leaf, i.e., no more children
			// add the total count of this path to the array
			arr.push(count);
		} else {
			node.children.forEach(child => {
				sumValues(child, count, arr);
			});
		}

		return arr;
	}

	// take out any duplicate counts from the array
	function withoutDupes(arr) {
		const newArr = [];

		// arr.forEach(i => {
		// 	let dupe = false;
		// 	newArr.forEach(j => {
		// 		if (i === j) dupe = true;
		// 	});
		// 	// if the item in the original array didn't match against another item in the new array, push it to the new array
		// 	if (!dupe) newArr.push(i);
		// });

		// possibly better implementation
		arr.forEach(item => {
			if (newArr.indexOf(item) === -1) newArr.push(item); // if the item doesn't exist in the new array, add it
		});

		return newArr;
	}

	// console.log(countArray);
	return countArray;
}

// check if there's a natural blackjack in either the player's hand and the dealer's hand upon the initial deal
function checkNatural() {
	const player21 = check21(grabCount(playerHand));
	const dealer21 = check21(grabCount(dealerHand));

	// check if the player has a natural blackjack
	if (player21) {
		// check if the dealer has a natural blackjack
		if (dealer21) {
			// console.log(`it's a tie! you both have a natural`);
			$('.play-buttons').hide();
			$('.message').html(`It's a tie! You both have a natural blackjack! ${playAgainText}`);
		} else {
			// console.log('you win!');
			$('.play-buttons').hide();
			$('.message').html(`You win! You have a natural blackjack! ${playAgainText}`);
		}
		// if only the dealer has a natural:
	} else if (dealer21) {
		// console.log('sorry, dealer wins :(');
		$('.play-buttons').hide();
		$('.message').html(`Sorry, the dealer wins with a natural blackjack :( ${playAgainText}`);
	} else { // no naturals, so the regular flow of the game begins - hit, stand, etc
		// console.log(`let's keep playing!`);
	}
}

// removes any counts over 21 from the array
function removeBust(countArray) {
	const nonBusted = countArray.filter(value => value <= 21);
	return nonBusted;
}

// displays the new card dealt on the page
function displayNewCard(player, card) {
	$(`.${player} .card-display`).append(
		`<div class="${player}-card">
		 	<img src="${card.image}" alt="${card.type} of ${card.suit}">
		 </div>`
	);
}

// used for the displayed count. returns the highest count that is less than or equal to 21
function highestLessEqual21(countArray) {
	const highest = countArray.reduce((highest, next) => (next > highest && next <= 21) ? next : highest, 0);
	// console.log('highest', highest);
	return highest;
}

function playerHit() {
	const newCard = cards.pop();
	playerHand.push(newCard); // add another card to the player's hand from the deck
	displayNewCard('player', newCard);

	// console.log('new playerHand', playerHand);

	const firstCount = grabCount(playerHand);
	$('#count-num').text(highestLessEqual21(firstCount));

	const count = removeBust(firstCount); // recalculate the counts and remove any counts that are over 21
	// console.log('new count', count);

	if (count.length === 0) {
		// console.log('sorry, u done and busted, son');
		$('.play-buttons').hide();
		$('#count-num').text('> 21');
		$('.message').html(`Game over. Your total is over 21. ${playAgainText}`);
	}
}

// add a card to the hand passed in - used for the dealer's hit
function dealerHit(hand) {
	const newCard = cards.pop();
	hand.push(newCard);
	displayNewCard('dealer', newCard);

	// console.log('new dealer', hand);

	return hand;
}

// check if the count array passed in has a 21 in it
function check21(countArray) {
	let is21 = false;

	countArray.forEach(item => {
		if (item === 21) is21 = true;
	});

	return is21;
}

// return the highest count value in the array
function highestCount(countArray) {
	const highest = countArray.reduce((highest, next) => (next > highest) ? next : highest, 0);
	// console.log('highest', highest);
	return highest;
}

// when the player decides to stand, begin the dealer play logic
function dealerPlay() {
	const dealerCount = removeBust(grabCount(dealerHand));
	const playerCount = removeBust(grabCount(playerHand));
	const dealer21 = check21(dealerCount);
	const player21 = check21(playerCount);
	const dealerHighest = highestCount(dealerCount);
	const playerHighest = highestCount(playerCount);

	$('.play-buttons').hide();
	$('#dealer-card2').html(`<img src="${dealerHand[1].image}" alt="${dealerHand[1].type} of ${dealerHand[1].suit}">`);
	$('#count-num-dealer').text(`(count: ${dealerHighest})`);

	if (dealerCount.length === 0) { // the dealer is over 21
		// console.log('dealer busted! you win!');
		$('#count-num-dealer').text(`(count: > 21)`);
		$('.message').html(`You win! The dealer went bust! ${playAgainText}`);
	} else if (dealer21) { // the dealer has a blackjack
		if (player21) { // and the player has a blackjack
			// console.log(`it's a tie!`);
			$('.message').html(`It's a tie! You both have ${playerHighest}. ${playAgainText}`);
		} else { // dealer has a blackjack and the player *doesn't* have a blackjcak
			// console.log(`sorry, dealer has 21 and wins :(`);
			$('.message').html(`Sorry, the dealer has 21 and wins :( ${playAgainText}`);
		}
	} else if (dealerHighest >= 17) { // dealer can't take anymore cards if total is equal or over 17
		if (playerHighest > dealerHighest) {
			// console.log(`you win! you have ${playerHighest} and the dealer has ${dealerHighest}`);
			$('.message').html(`You win! You have ${playerHighest} and the dealer has ${dealerHighest}. ${playAgainText}`);
		} else if (dealerHighest > playerHighest) {
			// console.log(`sorry, dealer wins :( you have ${playerHighest} and the dealer has ${dealerHighest}`);
			$('.message').html(`Sorry, the dealer wins :( You have ${playerHighest} and the dealer has ${dealerHighest}. ${playAgainText}`);
		} else { // playerHighest === dealerHighest
			// console.log(`it's a tie!`);
			$('.message').html(`It's a tie! You both have ${playerHighest}. ${playAgainText}`);
		}
	} else {
		dealerPlay(dealerHit(dealerHand));
	}
}

cards = shuffle(cards);
initialDeal();
$('#dealer-card1').append(`<img src="${dealerHand[0].image}" alt="${dealerHand[0].type} of ${dealerHand[0].suit}">`);
$('#player-card1').append(`<img src="${playerHand[0].image}" alt="${playerHand[0].type} of ${playerHand[0].suit}">`);
$('#player-card2').append(`<img src="${playerHand[1].image}" alt="${playerHand[1].type} of ${playerHand[1].suit}">`);
$('#count-num').text(highestCount(grabCount(playerHand)));
checkNatural();
$('#hit-button').click(playerHit);
$('#stand-button').click(dealerPlay);

// console.log('playerHand', playerHand);
// console.log('dealerHand', dealerHand);