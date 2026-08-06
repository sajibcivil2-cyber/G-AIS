import fs from 'fs';
let content = fs.readFileSync('src/components/DseVolumeBreakoutChart.tsx', 'utf8');

const oldTriangles = `          // Draw individual triangle shading for visual harmonic geometry (X-A-B and B-C-D)
          if (xCoordX !== null && xCoordA !== null && xCoordB !== null) {
            g.append('polygon')
              .attr('points', \`\${xCoordX},\${yCoordX} \${xCoordA},\${yCoordA} \${xCoordB},\${yCoordB}\`)
              .attr('fill', 'rgba(99, 102, 241, 0.1)')
              .attr('stroke', '#6366f1')
              .attr('stroke-width', 1)
              .attr('stroke-dasharray', '2,2')
              .attr('opacity', 0.6);
          }
        }`;

const newTriangles = `          // Draw individual triangle shading for visual harmonic geometry (X-A-B and B-C-D)
          if (xCoordX !== null && xCoordA !== null && xCoordB !== null) {
            g.append('polygon')
              .attr('points', \`\${xCoordX},\${yCoordX} \${xCoordA},\${yCoordA} \${xCoordB},\${yCoordB}\`)
              .attr('fill', 'rgba(99, 102, 241, 0.1)')
              .attr('stroke', '#6366f1')
              .attr('stroke-width', 1)
              .attr('stroke-dasharray', '2,2')
              .attr('opacity', 0.6);
          }
          if (xCoordB !== null && xCoordC !== null && xCoordD !== null) {
            g.append('polygon')
              .attr('points', \`\${xCoordB},\${yCoordB} \${xCoordC},\${yCoordC} \${xCoordD},\${yCoordD}\`)
              .attr('fill', 'rgba(99, 102, 241, 0.1)')
              .attr('stroke', '#6366f1')
              .attr('stroke-width', 1)
              .attr('stroke-dasharray', '2,2')
              .attr('opacity', 0.6);
          }
        }`;

content = content.replace(oldTriangles, newTriangles);
fs.writeFileSync('src/components/DseVolumeBreakoutChart.tsx', content);
