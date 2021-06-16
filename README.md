# userinterface.js [![Build Status](https://travis-ci.com/thoughtsunificator/userinterface.js.svg?branch=master)](https://travis-ci.com/thoughtsunificator/userinterface.js) 

Small library to build front-end apps.

userinterface.js was built around the idea that logic relating to how the visual looks and how the visual works should be distinguished.

## Getting started

### Installing

#### Scaffold

See [https://github.com/thoughtsunificator/userinterface.js-skeleton](https://github.com/thoughtsunificator/userinterface.js-skeleton).

#### Standalone

``git submodule add https://github.com/thoughtsunificator/userinterface.js.git lib/userinterface.js``

Add userinterface.js to the head section of your web page:

```html
<script src="./lib/userinterface.js/src/userinterface.js"></script>
```

### Model

A ```Model``` is an object representation of a [Node](https://developer.mozilla.org/en-US/docs/Web/API/Node).
It has three required properties depending on the [method](#methods): ```name```, ```method``` and ```properties``` or ```callback```,

The ```name``` property will be the identifier of your model it will be used whenever you need to run your model but also to associate a binding to your model.
The ```method``` property will describe how your model should be ran.
The ```properties``` and ```callback``` properties will contain the properties of your Elements.

A ```Model``` often goes along with a [Binding](#Binding) and an [Object](#Object).

#### Basic model

Here we create a model named ```simple model``` using the [method](#methods) ```appendChild``` it has a one ```LI``` [element](https://developer.mozilla.org/en-US/docs/Web/API/Element) child. `LI` has the className ```simplemodel``` and textContent ```My first simple model```.
This model uses the `textContent`, `className` and `tagName` propertie however you might use any Element properties the DOM API offers.

``src/userinterface/simplemodel.js``
```js
UserInterface.model({
	name: "simplemodel",
	method: UserInterface.appendChild,
	properties: {
		tagName: "li", // required
		className: "simplemodel",
		textContent: "My first simple model"
	}
});
```

```js
UserInterface.runModel("simplemodel", { parentNode: document.querySelector("ul") });
```
Output:
```html
<ul>
	<li class="simplemodel">My first simple model</li>
</ul>
```

#### Children

In the previous example we created a simple model, but what if we wanted to do more and add some children to it ?
The ```children``` property is here for that, it is an Array where you can specify child elements.

``src/userinterface/children.js``
```js
UserInterface.model({
	name: "children",
	method: UserInterface.appendChild,
	properties: {
		tagName: "div",
		className: "model",
		children: [
			{
				tagName: "div",
				className: "child",
				textContent: "My first child"
				// and so on..
			}
		]
	}
});
```

```js
UserInterface.runModel("children", { parentNode: document.body });
```
Output:
```html
<body>
	<div class="model">
		<div class="child">My first child</div>
	</div>
</body>
```
#### Callback

Models are required to have either the ```properties``` property or ```callback``` property, but exactly what does the ```callback``` property do ?
It is used when you want to echo some data in your model.

For example here, we have a model called ```echomodel``` that has the ```callback``` property. This property works the same as the ```properties``` property does except that an extra step is added before your model is ran.
The ```callback``` will return a ```properties``` object accordingly to the data you passed through ```runModel```.

``src/userinterface/echomodel.js``
```js
UserInterface.model(
	name: "echomodel",
	method: UserInterface.appendChild,
	callback: data => ({
		tagName: "p",
		className: "echomodel",
		textContent: "My "+data.text+" model"
	})
);
```

```js
UserInterface.runModel("echomodel", { parentNode: document.body, data: {"text": "echo" } });
```

Output:
```html
<p class="echomodel">My echo model</p>
```

#### Processed properties

- ``children`` Add children to an element


### Binding

A ```Binding``` is a callback function that, when bound to a model, is automatically called whenever the model has ran.
```Bindings``` will make your models more alive, an example of that would be adding an event listener to your model, that is the place where you will be doing it.

You can also do much more such as using event listeners to connect all of your models together!

A Binding is way to give life to your models enabling them to do things whenever their respective method is executed.
That means if you want to add a listener to an Element that's where you will be doing it.

In this example we will change the textContent of our model root element.

``src/userinterface/button.js``
```js
UserInterface.model({
	name: "button",
	method: UserInterface.appendChild,
	properties: {
		tagName: "button"
	}
});

UserInterface.bind("button", function(element) {
	element.textContent = "bound";
});
```

```js
UserInterface.runModel("button", { parentNode: document.body });
```

Output:
```html
<button>bound</button>
```

### Methods

- ```appendChild``` Append your model to the target

- ```insertBefore``` Insert your model before the target

- ```removeElement``` Remove the target

- ```replaceElement``` Replace the target with your model

- ```updateElement``` Update the target according to your model

- ```wrapElement``` Wrap the target inside your model

- ```removeListeners``` Remove the listeners of the target

### Objects

```Objects``` are the backbone of your models they will store and manipulate data for your ```Binding```.
That's where you want to hide the complicated stuff.

### Listeners

Listeners enable intercommunication for your models.

#### Main object

You usually wants to have a ``main object`` that you will pass to most of your models so that they communicate with each other through a central.

Note that you are not forced to have one and you could have multiple observables and still be able to handle inter-model communication.

Most of the time we call it ``application``.

#### Listening to events

In this example we are creating and running a model called ```myModel``` that will listen for the event ``greeting`` on through the ``application`` context.

A Context represent a reserved area (a channel) that events will be bound to, they're often represented as an instance of an object but could pretty much be anything.

``src/userinterface/my-model.js``
```js
UserInterface.model({
	name: "myModel",
	method: UserInterface.appendChild,
	properties: {
		tagName: "div"
	}
});
UserInterface.bind("myModel", function(element, application) {

	UserInterface.listen(application, "greeting", async (message) => {
		console.log(message)
	})

});
```


```js
const application = {}

UserInterface.runModel("myModel", { parentNode: document.body, bindingArgs: [application] });
```

For the moment we are only listening to the ``greeting`` event, we haven't announced anything to it yet.

#### Announcing events

In the previous example we setup a ``greeting`` listener on ``application``.

Now, let's try to announce to the event.

``src/userinterface/another-model.js``
```js
UserInterface.model({
	name: "anotherModel",
	method: UserInterface.appendChild,
	properties: {
		tagName: "div"
	}
});
UserInterface.bind("anotherModel", function(element, application) {

	UserInterface.announce(application, "greeting", "Hello!");

});
```

```js
const application = {}

UserInterface.runModel("myModel", { parentNode: document.body, bindingArgs: [application] });
UserInterface.runModel("anotherModel", { parentNode: document.body, bindingArgs: [application] });
```

If everything went well you should be able see a ``Hello!`` log message in the console.

#### Removing event listeners

Sometimes you might want your model to be dynamically added and removed, meaning that it will be added upon an action and removed upon another action.

Usually what you want to do is to create ``_listener`` variable and push all the listeners to this array and then remove them as needed using ``forEach`` for example.

In this example, we create a listener ``message`` and remove it whenever the event ``done`` is emitted.

```javascript
UserInterface.bind("myDynamicModel", function(element, application) {

	const _listeners = []

	_listeners.push(UserInterface.listen(application, "message", async data => {
		console.log(data)
	}))

	_listeners(UserInterface.listen(application, "done", async () => {
		_listeners.forEach(listener => UserInterface.removeListener(listener))
	}))

})
```

## API

You can read the API by visiting [https://thoughtsunificator.github.io/userinterface.js](https://thoughtsunificator.github.io/userinterface.js).

## Common errors

### Cannot set property 'binding' of undefined

UserInterface.js could not find the model specified when calling ``UserInterface.bind``.

### Cannot destructure property 'method' of 'model' as it is undefined.

UserInterface.js could not find the model specified when calling ``UserInterface.runModel``.

Feel free to [open an issue](https://github.com/thoughtsunificator/userinterface.js/issues) if you need assistance.

## Collection

userinterface.js also provides a collection that contains a few basic models to get you started. See [https://github.com/thoughtsunificator/userinterface.js-collection](https://github.com/thoughtsunificator/userinterface.js-collection).

## Extensions

See [https://github.com/topics/userinterface-js-extension](https://github.com/topics/userinterface-js-extension).

## Demos

See [https://github.com/topics/userinterface-js-demo](https://github.com/topics/userinterface-js-demo).

## Testing

- ``npm install``
- ``npm test``
