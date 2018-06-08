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

function append(s, t) {
  const noSpace = /\S$/.test(s) && /^\S/.test(t);
  return s + (noSpace ? ' ' : '') + t;
}

function space(el) {
  if (el.name.toLowerCase() == 'p') return '\n\n';
  return '';
}

function serializeNodes(nodes) {
  return nodes
    .filter(textOrElement)
    .reduce((s, child) => append(s, serialize(child)), '');
}

function serialize(node) {
  if (isText(node)) return node.value;
  if (isElement(node)) {
    return append(serializeNodes(node.children), space(node));
  }
  return '';
}

class PlainTextWriter {
  set() {}

  document(doc) {
    return serializeNodes(doc.children).trim();
  }
}

module.exports = PlainTextWriter;
