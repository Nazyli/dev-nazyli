# Celestial Scene Expansion

## Goal

Give the existing scroll-through-space portfolio a fuller planetary cast and a few recognizable deep-space objects, while keeping the Observatory design quiet enough for the portfolio content to remain primary.

## Design

- Keep the existing ringed planet and Earth as the Saturn and Earth landmarks.
- Add Mercury, Venus, Mars, Jupiter, Uranus, and Neptune as small background landmarks at separate camera-route milestones, with viewport-aware edge offsets that keep section copy unobstructed.
- Give each new body its own palette-specific color and relief maps: stamped craters for Mercury and Mars, swirling cloud decks for Venus, turbulent bands and a storm system for Jupiter, and distinct ice-band and storm patterns for Uranus and Neptune. Use thin edge-lit atmospheres and a narrow Uranian ring to keep the models readable at portfolio scale.
- Add one sparse, instanced asteroid belt and one distant comet with a short tapered tail. Both sit away from section copy and use the existing space palette.
- Keep celestial objects decorative and non-interactive in the Canvas. DOM continues to own all portfolio content.
- Generate compact, seeded, seamless procedural maps from the existing theme tokens; use relief and transparent cloud layers where the planet calls for them. Keep the spheres low-poly, the asteroid belt instanced, and the rendering free of new dependencies, downloaded assets, or heavy postprocessing.
- Pause ambient rotation with the existing motion controls and respect reduced-motion behavior.

## Verification

- Inspect the complete scroll route at desktop and mobile sizes for visibility and text overlap.
- Run the repository lint and production build commands.
- Check the reduced-motion fallback and the WebGL fallback remain intact.
