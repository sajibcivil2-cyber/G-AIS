import fs from 'fs';
let content = fs.readFileSync('src/components/DseVolumeBreakoutChart.tsx', 'utf8');

const oldPoints = `        const xCoordX = getXCoord(harmonic.xDate);
        const xCoordA = getXCoord(harmonic.aDate);
        const xCoordB = getXCoord(harmonic.bDate);
        const xCoordC = getXCoord(harmonic.cDate);

        const yCoordX = yScalePrice(harmonic.xPrice);
        const yCoordA = yScalePrice(harmonic.aPrice);
        const yCoordB = yScalePrice(harmonic.bPrice);
        const yCoordC = yScalePrice(harmonic.cPrice);

        // Define Points Array
        const hPoints = [
          { name: 'X', x: xCoordX, y: yCoordX, price: harmonic.xPrice },
          { name: 'A', x: xCoordA, y: yCoordA, price: harmonic.aPrice },
          { name: 'B', x: xCoordB, y: yCoordB, price: harmonic.bPrice },
          { name: 'C', x: xCoordC, y: yCoordC, price: harmonic.cPrice },
        ];`;

const newPoints = `        const xCoordX = getXCoord(harmonic.xDate);
        const xCoordA = getXCoord(harmonic.aDate);
        const xCoordB = getXCoord(harmonic.bDate);
        const xCoordC = getXCoord(harmonic.cDate);
        const xCoordD = harmonic.dDate ? getXCoord(harmonic.dDate) : null;

        const yCoordX = yScalePrice(harmonic.xPrice);
        const yCoordA = yScalePrice(harmonic.aPrice);
        const yCoordB = yScalePrice(harmonic.bPrice);
        const yCoordC = yScalePrice(harmonic.cPrice);
        const yCoordD = harmonic.dPrice !== undefined ? yScalePrice(harmonic.dPrice) : null;

        // Define Points Array
        const hPoints = [
          { name: 'X', x: xCoordX, y: yCoordX, price: harmonic.xPrice },
          { name: 'A', x: xCoordA, y: yCoordA, price: harmonic.aPrice },
          { name: 'B', x: xCoordB, y: yCoordB, price: harmonic.bPrice },
          { name: 'C', x: xCoordC, y: yCoordC, price: harmonic.cPrice },
        ];
        if (xCoordD !== null && yCoordD !== null) {
          hPoints.push({ name: 'D', x: xCoordD, y: yCoordD, price: harmonic.dPrice! });
        }`;

content = content.replace(oldPoints, newPoints);
fs.writeFileSync('src/components/DseVolumeBreakoutChart.tsx', content);
