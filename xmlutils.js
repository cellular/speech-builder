function getNodeType(node) {
  return node.constructor.name;
}

function isElement(node) {
  return getNodeType(node) == 'XMLElement';
}

function isText(node) {
  return getNodeType(node) == 'XMLText';
}

function textOrElement(node) {
  return isText(node) || isElement(node);
}

function previousSibling(el) {
  const { children } = el.parent;
  const i = children.indexOf(el);
  return i ? children[i - 1] : null;
}

function lastChild(el) {
  const { children } = el;
  const i = children.length;
  return i ? children[i - 1] : null;
}

function isWhiteSpace(node) {
  return !node || (isText(node) && /\s$/.test(node.value));
}

module.exports = {
  getNodeType,
  isElement,
  isText,
  isWhiteSpace,
  textOrElement,
  lastChild,
  previousSibling,
};
