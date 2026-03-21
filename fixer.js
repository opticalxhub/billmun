const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./src');
let fixedCount = 0;
for (const file of files) {
  try {
    const content = fs.readFileSync(file, 'utf8').trim();
    if (content === '}' || content === '};' || content.startsWith('}')) {
      const parsedPath = path.parse(file);
      let componentName = parsedPath.name.replace(/[^a-zA-Z0-9]/g, '');
      if (componentName === 'page' || componentName === 'layout') {
          // just basic uppercase component name for layout and page
          componentName = componentName.charAt(0).toUpperCase() + componentName.slice(1);
      } else {
          componentName = componentName.charAt(0).toUpperCase() + componentName.slice(1);
      }
      if (!componentName || !/[A-Za-z]/.test(componentName)) {
         componentName = "MyComponent";
      }

      const isClient = content.includes('use client') || file.includes('components');
      const template = (isClient ? '"use client";\n\n' : '') +
        'import React from "react";\n\n' +
        'export default function ' + componentName + '() {\n' +
        '  return <div className="p-4">Placeholder for ' + parsedPath.base + '</div>;\n' +
        '}\n';
      fs.writeFileSync(file, template);
      console.log('Fixed', file);
      fixedCount++;
    } else if (content === 'Button.displayName = "Button";') {
       const buttonCode = 'import * as React from "react";\n' +
       'export const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>((props, ref) => (\n' +
       '  <button ref={ref} className="px-4 py-2 bg-text-primary text-bg-base rounded" {...props} />\n' +
       '));\n' +
       'Button.displayName = "Button";\n';
       fs.writeFileSync(file, buttonCode);
       console.log('Fixed Button', file);
       fixedCount++;
    }
  } catch(e) {
     console.error("Error reading file", file, e);
  }
}
console.log('Total fixed:', fixedCount);
