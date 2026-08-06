import fs from 'fs';
let content = fs.readFileSync('src/components/DseVolumeBreakoutChart.tsx', 'utf8');

const oldTarget = `        if (xCoordC !== null) {
          // Draw a clean horizontal target line for Point D (the main price target)
          const yTargetD = yScalePrice(harmonic.dTargetPrice);
          if (yTargetD >= 0 && yTargetD <= priceHeight) {
            g.append('line')
              .attr('x1', xCoordC)
              .attr('y1', yTargetD)`;

const newTarget = `        const lastPointCoord = xCoordD !== null ? xCoordD : xCoordC;
        if (lastPointCoord !== null) {
          // Draw a clean horizontal target line for the main price target
          const yTargetD = yScalePrice(harmonic.dTargetPrice);
          if (yTargetD >= 0 && yTargetD <= priceHeight) {
            g.append('line')
              .attr('x1', lastPointCoord)
              .attr('y1', yTargetD)`;

content = content.replace(oldTarget, newTarget);
fs.writeFileSync('src/components/DseVolumeBreakoutChart.tsx', content);
