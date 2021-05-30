(function() {

	const PROPERTIES_PROCESSED = ["tagName", "children"]
	const APPEND_CHILD = "appendChild"
	const INSERT_BEFORE = "insertBefore"
	const REMOVE_ELEMENT = "removeElement"
	const UPDATE_ELEMENT = "updateElement"
	const REPLACE_ELEMENT = "replaceElement"
	const WRAP_ELEMENT = "wrapElement"
	const CLEAR_LISTENERS = "clearListeners"
	const METHODS_CREATE = [
		APPEND_CHILD,
		INSERT_BEFORE,
		REPLACE_ELEMENT,
		WRAP_ELEMENT
	]

	const _models = []
	let _listeners = []

	/**
	 * @type {string}
	 */
	this.appendChild = APPEND_CHILD
	/**
	 * @type {string}
	 */
	this.insertBefore = INSERT_BEFORE
	/**
	 * @type {string}
	 */
	this.removeElement = REMOVE_ELEMENT
	/**
	 * @type {string}
	 */
	this.replaceElement = REPLACE_ELEMENT
	/**
	 * @type {string}
	 */
	this.updateElement = UPDATE_ELEMENT
	/**
	 * @type {string}
	 */
	this.wrapElement = WRAP_ELEMENT
	/**
	 * @type {string}
	 */
	this.clearListeners = CLEAR_LISTENERS

	/**
	 * Load a model
	 * @param {object} 							model
	 * @param {string} 							model.name                  The name of the model
	 * @param {string} 							model.method                One of the following methods name: appendChild, insertBefore, removeElement, updateElement, replaceElement, wrapElement, clearListeners
	 * @param {Object}							model.properties  					Processed properties along with any properties an Element¹ can have
	 * @param {function}						[model.callback]  					Callback of processed properties along with any properties an Element¹ can have
	 * @param {Object[]} 						[model.properties.children]	An array of the "properties" object
	 */
	this.model = function(model) {
		_models.push(model)
	}

	/**
	 * Link a model to a "binding", that is a callback function
	 * @param {string} 	 name 	  The name of the model
	 * @param {function} callback The function binding the model
	*/
	this.bind = function(name, callback) {
		_models.find(model => model.name === name).binding = {name, callback}
	}

	/**
	 * Update the DOM accordingly to a model
	 * @param {string}  name 		    						 The name of the model
	 * @param {Object}  parameters						 The parameters of the model
	 * @param {Object}  [parameters.data] 			 The data that will be echoed on the model
	 * @param {Element} parameters.parentNode	 The target Node
	 * @param {Array}   [parameters.bindingArgs] The arguments that go along with the binding
	 */
	this.runModel = async function(name, parameters = {}) {
		const model = _models.find(model => model.name === name)
		let { method, properties } = model
		if (model.hasOwnProperty("callback") === true) {
			properties = model.callback(parameters.data)
		}
		let element
		if (METHODS_CREATE.includes(method) === true) {
			element = await UserInterface.createElement(properties)
		}
		if (method === APPEND_CHILD) {
			parameters.parentNode.appendChild(element)
		} else if (method === INSERT_BEFORE) {
			parameters.parentNode.parentNode.insertBefore(element, parameters.parentNode)
		} else if (method === REMOVE_ELEMENT) {
			parameters.parentNode.parentNode.removeChild(parameters.parentNode)
		} else if (method === REPLACE_ELEMENT) {
			parameters.parentNode.parentNode.replaceChild(element, parameters.parentNode)
		} else if (method === UPDATE_ELEMENT) {
			Object.assign(parameters.parentNode, properties)
		} else if (method === WRAP_ELEMENT) {
			element.appendChild(parameters.parentNode.cloneNode(true))
			parameters.parentNode.parentNode.replaceChild(element, parameters.parentNode)
		} else if (method === CLEAR_LISTENERS) {
			parameters.parentNode.parentNode.replaceChild(parameters.parentNode.cloneNode(true), parameters.parentNode)
		}
		if (element && model.hasOwnProperty("binding") === true) {
			await	model.binding.callback.apply(null, [element].concat(parameters.bindingArgs))
		}
	}

	/**
	 * Transform a model into an Element
	 * @param   {object}   properties	Processed properties along with any properties a Element can have
	 * @param   {function} [callback]	Callback version of properties
	 * @returns {Element}             An array of Elements¹
	 */
	this.createElement = async function(properties) {
		const { tagName, children = [] } = properties
		const element = document.createElement(tagName)
		Object.keys(properties).filter(property => PROPERTIES_PROCESSED.includes(property) === false).forEach(function(property) {
			element[property] = properties[property]
		})
		for (const child of children) {
			const childNode = await UserInterface.createElement(child)
			element.appendChild(childNode)
		}
		return element
	}

	/**
	 * Returns the properties of a model
	 * @param  {string} name   The name of the model
	 * @param  {Object} [data] The data that will be echoed on the model
	 * @returns {Object}	       The "properties" object of the model
	 */
	this.getModelProperties = function(name, data) {
		const model = _models.find(model => model.name === name)
		if (model.hasOwnProperty("callback")) {
			return model.callback(data)
		} else if (model.hasOwnProperty("properties")) {
			return model.properties
		}
	}

	/**
	 * Load a listener
	 * @param  {*} 		  	context	 Where the announce will be broadcasted
	 * @param  {string}   title 	 The content of the message
	 * @param  {function} callback
	 */
	this.listen = function(context, title, callback) {
		const listener = {context, title, callback}
		_listeners.push(listener)
		return listener
	}

	/**
	 * Remove a listener
	 * @param  {Object} listener
	 */
	this.removeListener = function(listener) {
		_listeners = _listeners.filter(listener_ => listener_ !== listener)
	}

	/**
	 * Message one or many listeners
	 * @param  {*} 			context Where the announce will be broadcasted
	 * @param  {string} title 	The title of the announce
	 * @param  {*} 			content The content of the announce
	 */
	this.announce = async function(context, title, content) {
		const listeners = _listeners.filter(listener => listener.context === context && listener.title === title)
		for (const listener of listeners) {
			await listener.callback(content)
		}
	}

}).call(UserInterface = {})
