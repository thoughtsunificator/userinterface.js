const fs = require('fs')
const path = require('path')
const JSDOM = require("jsdom").JSDOM

const scriptFile = fs.readFileSync(path.resolve(__dirname, "../src/userinterface.js"), { encoding: "utf-8" })

let window

exports.setUp = async function(callback) {
	window = (new JSDOM(``, { runScripts: "dangerously" })).window
	const scriptNode = window.document.createElement("script")
	scriptNode.textContent = scriptFile
	window.document.head.appendChild(scriptNode)
	callback()
}

exports.model = async function (test) {
	test.expect(1)

	const expected = '<div class="simplemodel" id="simplemodel">My first simple model</div>'
	await window.UserInterface.model({
		name: "nodeunit.simplemodel",
		method: window.UserInterface.appendChild,
		properties: {
			tagName: "div",
			className: "simplemodel",
			id: "simplemodel",
			textContent: "My first simple model"
		}
	})
	await window.UserInterface.runModel("nodeunit.simplemodel", { parentNode: window.document.body })
	test.strictEqual(window.document.body.innerHTML, expected)

	test.done()
}

exports.childNodes = async function (test) {
	test.expect(1)

	const expected = '<div class="simplemodel">My first element<div class="child">My first child<div class="child">My first child child</div></div></div>'
	window.UserInterface.model({
		name: "nodeunit.children",
		method: window.UserInterface.appendChild,
		properties: {
			tagName: "div",
			className: "simplemodel",
			textContent: "My first element",
			children: [
				{
					tagName: "div",
					className: "child",
					textContent: "My first child",
					children: [
						{
							tagName: "div",
							className: "child",
							textContent: "My first child child"
						}
					]
				}
			]
		}
	})
	await window.UserInterface.runModel("nodeunit.children", { parentNode: window.document.body })
	test.strictEqual(window.document.body.innerHTML, expected)

	test.done()
}

exports.getModelProperties = async function (test) {
	test.expect(1)

	const expected = '<div class="simplemodel"><div class="data"><div>My first child</div></div><div></div><button></button><div><div></div></div></div>'
	window.UserInterface.model({
		name: "nodeunit.child",
		method: window.UserInterface.appendChild,
		properties: {
			tagName: "div"
		}
	})
	window.UserInterface.model({
		name: "nodeunit.child2",
		method: window.UserInterface.appendChild,
		properties: {
			tagName: "div",
			children: [
				{
					tagName: "div"
				}
			]
		}
	})
	window.UserInterface.model({
		name: "nodeunit.childbutton",
		method: window.UserInterface.appendChild,
		properties: {
			tagName: "button"
		}
	})
	window.UserInterface.model({
		name: "nodeunit.childdata",
		method: window.UserInterface.appendChild,
		callback: data => ({
			tagName: "div",
			textContent: data.text
		})
	})
	window.UserInterface.model({
		method: window.UserInterface.appendChild,
		name: "nodeunit.modelaschild",
		properties: {
			tagName: "div",
			className: "simplemodel",
			children: [
				{
					tagName: "div",
					className: "data",
					children: [
						window.UserInterface.getModelProperties("nodeunit.childdata", {
							text: "My first child"
						})
					]
				},
				window.UserInterface.getModelProperties("nodeunit.child"),
				window.UserInterface.getModelProperties("nodeunit.childbutton"),
				window.UserInterface.getModelProperties("nodeunit.child2")
			]
		}
	})
	await window.UserInterface.runModel("nodeunit.modelaschild", { parentNode: window.document.body })
	test.strictEqual(window.document.body.innerHTML, expected)

	test.done()
}

exports.callback = async function (test) {
	test.expect(1)

	const expected = '<p class="callback" id="simplemodel">My echo model<span>My echo model<span>My echo model</span></span></p>'
	window.UserInterface.model({
		name: "nodeunit.callback",
		method: window.UserInterface.appendChild,
		callback: data => ({
			tagName: data.tagName,
			className: data.className,
			id: "simplemodel",
			textContent: "My "+data.textContent+" model",
			children: [
				{
					tagName: "span",
					textContent: "My "+data.textContent+" model",
					children: [
						{
							tagName: "span",
							textContent: "My "+data.textContent+" model"
						}
					]
				}
			]
		})
	})
	await window.UserInterface.runModel("nodeunit.callback", {
		parentNode: window.document.body,
		data: {
			"tagName": "p",
			"textContent": "echo",
			"className": "callback"
		}
	})
	test.strictEqual(window.document.body.innerHTML, expected)

	test.done()
}

exports.insertBefore = async function (test) {
	test.expect(1)

	const expected = '<ul><li>First element</li><li>Second element</li><li>Third element</li></ul>'
	window.document.body.innerHTML = '<ul><li>First element</li><li>Third element</li></ul>'
	window.UserInterface.model({
		name: "nodeunit.listModel",
		method: window.UserInterface.insertBefore,
		properties: {
			tagName: "li",
			textContent: "Second element"
		}
	})
	await window.UserInterface.runModel("nodeunit.listModel", { parentNode: window.document.querySelector("ul li:nth-child(2)") })
	test.strictEqual(window.document.body.innerHTML, expected)

	test.done()
}

exports.removeElement = async function (test) {
	test.expect(1)

	const expected = '<div class="adiv"></div>'
	window.document.body.innerHTML = '<div class="adiv"></div><div class="removeme"></div>'
	window.UserInterface.model({
		name : "nodeunit.removeIt",
		method: window.UserInterface.removeElement
	})
	await window.UserInterface.runModel("nodeunit.removeIt", { parentNode: window.document.querySelector(".removeme") })
	test.strictEqual(window.document.body.innerHTML, expected)

	test.done()
}

exports.replaceElement = async function (test) {
	test.expect(1)

	const expected = '<span class="newelement"></span>'
	window.document.body.innerHTML = '<div class="oldelement"></div>'
	window.UserInterface.model({
		name: "nodeunit.removeIt",
		method: window.UserInterface.replaceElement,
		properties: {
			tagName: "span",
			className: "newelement"
		}
	})
	await window.UserInterface.runModel("nodeunit.removeIt", { parentNode: window.document.querySelector(".oldelement") })
	test.strictEqual(window.document.body.innerHTML, expected)

	test.done()
}

exports.updateElement = async function (test) {
	test.expect(1)

	const text = "Published 02/06/2019"
	const expected = '<p>'+text+'</p>'
	window.document.body.innerHTML = '<p>Published 01/01/1900</p>'
	window.UserInterface.model({
		name: "nodeunit.updateDate",
		method: window.UserInterface.updateElement,
		properties: {
			textContent: text
		}
	})
	await window.UserInterface.runModel("nodeunit.updateDate", { parentNode: window.document.querySelector("p") })
	test.strictEqual(window.document.body.innerHTML, expected)

	test.done()
}

exports.wrapElement = async function (test) {
	test.expect(1)

	const expected = '<div class="wrapper"><p></p><textarea></textarea></div>'
	window.document.body.innerHTML = '<textarea></textarea>'
	window.UserInterface.model({
		name: "nodeunit.makeAForm",
		method: window.UserInterface.wrapElement,
		properties: {
			tagName: "div",
			className: "wrapper",
			children: [
				{
				tagName: "p",
				}
			]
		}
	})
	await window.UserInterface.runModel("nodeunit.makeAForm", { parentNode: window.document.querySelector("textarea") })
	test.strictEqual(window.document.body.innerHTML, expected)

	test.done()
}

exports.bindings = async function (test) {
	test.expect(1)

	const expected = '<button>bound</button>'
	window.UserInterface.model({
		name: "nodeunit.button",
		method: window.UserInterface.appendChild,
		properties: {
			tagName: "button"
		}
	})
	window.UserInterface.bind("nodeunit.button", function(element) {
		element.textContent = "bound"
	})
	await window.UserInterface.runModel("nodeunit.button", { parentNode: window.document.body })
	test.strictEqual(window.document.body.innerHTML, expected)

	test.done()
}

exports.bindingArgs = async function (test) {
	test.expect(1)

	window.UserInterface.model({
		name: "nodeunit.button",
		method: window.UserInterface.appendChild,
		properties: {
			tagName: "button"
		}
	})
	window.UserInterface.bind("nodeunit.button", function(element, text) {
		test.strictEqual(text, "bound")
	})
	await window.UserInterface.runModel("nodeunit.button", { parentNode: window.document.body, bindingArgs: ["bound"] })

	test.done()
}

exports.bindingsNestedModels = async function (test) {
	test.expect(1)

	const expected = '<button><button>bound</button></button>'
	window.UserInterface.model({
		name: "nodeunit.button",
		method: window.UserInterface.appendChild,
		properties: {
			tagName: "button"
		}
	})
	window.UserInterface.model({
		name: "nodeunit.button2",
		method: window.UserInterface.appendChild,
		properties: {
			tagName: "button"
		}
	})
	window.UserInterface.bind("nodeunit.button", async function(element) {
		await window.UserInterface.runModel("nodeunit.button2", {parentNode: element})
	})
	window.UserInterface.bind("nodeunit.button2", async function(element) {
		element.textContent = "bound"
	})
	await window.UserInterface.runModel("nodeunit.button", {parentNode: window.document.body})
	test.strictEqual(window.document.body.innerHTML, expected)
	test.done()
}

exports.clearListeners = async function (test) {
	test.expect(2)

	let clicked = false
	window.document.body.innerHTML = "<button></button>"
	window.document.querySelector("button").addEventListener("click", function() {
		clicked = true
	})
	window.UserInterface.model({
		name: "nodeunit.button",
		method: window.UserInterface.clearListeners
	})
	window.document.querySelector("button").click()
	test.strictEqual(clicked, true)
	clicked = false
	await window.UserInterface.runModel("nodeunit.button", { parentNode: window.document.querySelector("button") })
	window.document.querySelector("button").click()
	test.strictEqual(clicked, false)

	test.done()
}

exports.parentNode = async function (test) {
	test.expect(1)

	const expected = '<div><button></button></div><div><button></button></div>'
	window.document.body.innerHTML = "<div></div><div></div>"
	window.UserInterface.model({
		name: "nodeunit.button",
		method: window.UserInterface.appendChild,
		properties: {
			tagName: "button"
		}
	})
	await window.UserInterface.runModel("nodeunit.button", {
		parentNode: window.document.querySelectorAll("div")[0]
	})
	await window.UserInterface.runModel("nodeunit.button", {
		parentNode: window.document.querySelectorAll("div")[1]
	})
	test.strictEqual(window.document.body.innerHTML, expected)

	test.done()
}

exports.listeners = async function (test) {
	const path = []
	test.expect(1)
	const myContext = {}
	const myContext2 = {}
	window.UserInterface.listen(myContext, "test1", data => path.push("first"))
	window.UserInterface.listen(myContext, "test1", data => path.push("second"))
	window.UserInterface.listen(myContext, "test2", data => path.push("third"))
	window.UserInterface.listen(myContext2, "test1", data => path.push("fourth"))
	await window.UserInterface.announce(myContext, "test1")
	await window.UserInterface.announce(myContext, "test2")
	await window.UserInterface.announce(myContext2, "test1")
	test.deepEqual(path, [
		"first", "second", "third", "fourth"
	])
	test.done()
}

exports.listenersChained = async function (test) {
	test.expect(1)
	const path = []
	const myContext = {}
	window.UserInterface.listen(myContext, "chained1", async function(data) {
		path.push("chained1")
		await window.UserInterface.announce(myContext, "chained2")
	})
	window.UserInterface.listen(myContext, "chained2", async function(data) {
		path.push("chained2")
		await window.UserInterface.announce(myContext, "chained3")
	})
	window.UserInterface.listen(myContext, "chained3", async function(data) {
		path.push("chained3")
	})
	await window.UserInterface.announce(myContext, "chained1")
	test.deepEqual(path, [
		"chained1", "chained2", "chained3"
	])
	test.done()
}

exports.listenersNested = async function (test) {
	test.expect(1)
	const path = []
	const myContext = {}
	window.UserInterface.listen(myContext, "nest1", async function(data) {
		path.push("nest1")
		await window.UserInterface.announce(myContext, "nest2")
		await window.UserInterface.announce(myContext, "nest5")
	})
	window.UserInterface.listen(myContext, "nest2", async function(data) {
		path.push("nest2")
		await window.UserInterface.announce(myContext, "nest3")
		await window.UserInterface.announce(myContext, "nest4")
	})
	window.UserInterface.listen(myContext, "nest3", data => path.push("nest3"))
	window.UserInterface.listen(myContext, "nest4", data => path.push("nest4"))
	window.UserInterface.listen(myContext, "nest5", data => path.push("nest5"))
	await window.UserInterface.announce(myContext, "nest1")
	await window.UserInterface.announce(myContext, "nest1")
	await window.UserInterface.announce(myContext, "nest1")
	test.deepEqual(path, [
		"nest1", "nest2", "nest3", "nest4", "nest5",
		"nest1", "nest2", "nest3", "nest4", "nest5",
		"nest1", "nest2", "nest3", "nest4", "nest5",
	])
	test.done()
}

exports.removeListener = async function (test) {
	test.expect(1)
	const path = []
	const myContext = {}
	const listener = window.UserInterface.listen(myContext, "test", async function(data) {
		path.push("1_" + data)
	})
	window.UserInterface.listen(myContext, "test", async function(data) {
		path.push(data)
	})
	await window.UserInterface.announce(myContext, "test", "test1")
	await window.UserInterface.announce(myContext, "test", "test2")
	window.UserInterface.removeListener(listener)
	await window.UserInterface.announce(myContext, "test", "test3")
	await window.UserInterface.announce(myContext, "test", "test4")
	test.deepEqual(path, [
		"1_test1", "test1", "1_test2", "test2", "test3", "test4"
	])
	test.done()
}