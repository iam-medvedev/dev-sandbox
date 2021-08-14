const initialCode = `// Example
function hello(str: string) {
  return \`Hello \${str}\`
}

document.getElementById('app').innerHTML = hello('world');
`;

module.exports = {
  initialCode,
};
