# Celestial Scene Expansion

## Goal

Give the existing scroll-through-space portfolio a fuller planetary cast and a few recognizable deep-space objects, while keeping the Observatory design quiet enough for the portfolio content to remain primary.

## Design

- Keep the existing ringed planet and Earth as the Saturn and Earth landmarks.
- Add Mercury, Venus, Mars, Jupiter, Uranus, and Neptune as small background landmarks across the camera route, completing the eight-planet set.
- Give each new body a restrained procedural surface treatment: rocky texture for Mercury and Mars, cloud cover for Venus, broad bands for Jupiter, and cool atmospheric bands for Uranus and Neptune.
- Add one sparse, instanced asteroid belt and one distant comet with a short tapered tail. Both sit away from section copy and use the existing space palette.
- Keep celestial objects decorative and non-interactive in the Canvas. DOM continues to own all portfolio content.
- Reuse low-resolution procedural textures, low-poly spheres, and instancing. Do not add dependencies, downloaded assets, new colors, or heavy postprocessing.
- Pause ambient rotation with the existing motion controls and respect reduced-motion behavior.

## Verification

- Inspect the complete scroll route at desktop and mobile sizes for visibility and text overlap.
- Run the repository lint and production build commands.
- Check the reduced-motion fallback and the WebGL fallback remain intact.
