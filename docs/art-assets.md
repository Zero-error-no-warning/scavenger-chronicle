# 0.1.3 生成画像素材

組み込みの画像生成ツールで作成。画像の絵柄・差分は生成ツールで制作し、WebPへの形式変換だけImageMagickで実施。透明素材のアルファは維持しています。元の生成PNGは編集していません。

## backgrounds

```text
Use case: stylized-concept.
Asset type: production background atlas for a Japanese post-apocalyptic scavenging game, raster illustration, not UI.
Create ONE high-resolution landscape image, ideally 3072x1728 pixels, divided into exactly 3 columns and 3 rows of equal 16:9 background panels with NO gutters, NO borders and NO text. Nine distinct backgrounds. Reading order:
row1: cracked abandoned highway with weeds and disused petrol station; shuttered small Japanese shopping street; vine-covered small abandoned clinic with faded red cross.
row2: silent small industrial workshop with rusty machines and chimney; deep green woodland with a winding trail and abandoned tent; windowless aging Japanese apartment blocks.
row3: scrapyard with piles of old cars and household appliances; muddy riverside below a damaged concrete bridge; abandoned communications tower and small utility building.
Each panel must be a separate coherent landscape with horizon in upper half and empty foreground path in bottom third for game characters. No people, no animals, no vehicles prominently occupying foreground, no legible signage. Beautiful expressive painted gouache and ink game concept art, soft atmospheric light, detailed foliage and worn concrete, earthy greens, warm creams, rust-orange accents, slightly whimsical melancholy survival world. Subtle visible brushwork and rich depth; never flat geometric vector shapes, no pixel art, no watermarks. All nine panels fill their cell edge-to-edge.
```

## player_outfits

```text
Use case: stylized-concept.
Asset type: one transparent production sprite atlas for a Japanese scavenging survival game.
Create ONE image with exactly 4 columns by 3 rows of evenly sized portrait cells, twelve full-body sprites of the SAME young adult androgynous scavenger, short tousled dark hair, amber brown eyes, neck scarf, worn trousers and boots, small canvas backpack. Expressive painted anime game character, 3.5 heads tall, readable silhouette, warm earthy palette, detailed gouache and ink brushwork, pleasing design, not geometric vector art, not photorealistic.
All sprites in the identical front three-quarter pose facing slightly toward image right, standing, eyes looking right. Head at same height, feet on same baseline within every cell. Each figure centered inside its cell with generous transparent margin; no overlap between cells. Right arm on IMAGE RIGHT held slightly away from hip, empty hand curled to grip a separate weapon; LEFT arm relaxed. No weapons.
The 4 columns specify clothing: column1 teal work jacket, column2 orange padded puffer coat, column3 dark slate protective vest over gray shirt, column4 mustard yellow raincoat.
The 3 rows specify headgear: row1 rusty red baseball cap, row2 ochre construction hard hat, row3 old brass and green goggles worn on forehead WITHOUT any hat.
Important: exactly TWELVE sprites, row1 all four coats wearing red caps, row2 all four coats wearing hard hats, row3 all four coats wearing goggles. Preserve the same identity, pose, scale and placement. Entire background genuinely transparent with alpha, no checkerboard, no white matte, no panels or borders, no text, no labels, no watermark. High resolution atlas ideally 2048x2304. Each head-to-toe sprite fully inside its cell.
```

## weapons

```text
Use case: stylized-concept.
Asset type: transparent weapon sprite atlas for a painted anime scavenging game.
One image, exactly 3 columns by 2 rows, six isolated items on genuine transparent alpha. Each equal cell contains just one worn scavenged tool, oriented VERTICALLY, front three-quarter view, fully contained with transparent margins. The hand grip on the shaft must be at the exact CENTER of each cell for compositing onto an empty character hand.
Reading order: top row rustic straw broom (wooden handle above grip, golden straw bristles below grip), practical steel knife (blade above grip, leather handle below), rusty bent metal pipe; bottom row wooden hand axe (steel axe blade at top), worn blue umbrella open at top with curved shaft handle at bottom, old digging shovel (D-grip at top, wooden shaft, spade blade at bottom).
Consistent expressive ink and gouache rendering, detailed material wear, warm earthy palette, clean silhouettes, transparent margins at least 10% of each cell. No characters, no hands, no decorative backgrounds, no labels, no text, no white matte, no checkerboard, no borders, no watermark. Do not repeat or omit an item. High-quality raster illustration, not flat SVG style. Ideally 1536x1536.
```

## enemies

```text
Use case: stylized-concept. Asset type: transparent enemy sprite atlas for a Japanese painted anime survival RPG.
ONE wide image, exactly THREE equal columns, one isolated full-body enemy centered in each cell on true transparent alpha. Cell1: lean feral tan dog, alert snarl with teeth, shaggy fur, four paws visible, facing left toward player. Cell2: hostile scrap scavenger, young adult human in battered plum-gray patchwork clothing and rusty red scarf covering mouth, messy dark hair, clutching scavenged club, guarded stance facing left. Cell3: damaged small maintenance robot, moss-green and cream metal casing, rounded rectangular head, two glowing amber eye lenses, improvised mismatched mechanical limbs, antenna, rusty surfaces, stance facing left.
Style: detailed painted gouache and ink, expressive anime game illustration, 3.5-heads-tall human, earthy palette, subtle highlights, sympathetic but dangerous abandoned-world creatures. All three fully contained in their cell with at least 10% empty transparent margins, feet/paws on same low baseline, no overlapping cells. No ground plane, no environment, no text, no labels, no borders, no checkerboard, no white matte, no watermarks. Rich raster texture, not geometric vector clipart. Ideally 2048x1024.
```

## enemy_spacing_edit

```text
Edit target: the attached transparent three-enemy sprite sheet. Preserve all three character identities, clothing, color, style and poses. Re-layout it as a clean production atlas: EXACTLY THREE SQUARE CELLS side by side in a 3:1 aspect-ratio canvas. The dog entirely in left cell, human entirely middle cell, robot entirely right cell. Each whole silhouette INCLUDING tails, clubs, antenna, fingers, feet must fit inside the CENTRAL 75% of its own cell; clear transparent padding on all four sides; absolutely no character or object may cross a cell boundary. Scale each enemy down as necessary. All feet/paws on same baseline at 88% cell height. No cell borders or labels. Genuine transparent background and clean edges. Do not omit or crop any part of an enemy. This is for CSS sprite extraction at 0%, 50%, 100%.
```

## van

```text
Use case: stylized-concept. Asset type: standalone transparent camper van sprite for a Japanese painted survival RPG.
A small charming patched camper van called home, weathered sage green body with cream lower stripe, rust spots, wood repair panels, curtained side window warmly lit, roof cargo basket with a rolled tarp and wooden crate, two visible dusty wheels. Full vehicle, front three-quarter view facing RIGHT, cabin on right, rear on left, perspective close to side view so recognizable game sprite. Paint texture, ink accents, gouache anime background-art quality, rich wear details, soft warm sunlight, nostalgic resourceful abandoned-world mood. Entire silhouette contained with generous 10% transparent margins, no ground, no backdrop, no characters, no text, no label, no lettering, no watermark. Genuine transparent alpha with no checkerboard or white matte. Wide image ideally 1536x1024. Must look illustrated and tactile, not geometric vector clipart.
```

## terrain

```text
Use case: stylized-concept. Asset type: illustrated terrain background for a clickable procedural survival game map.
A wide bird's-eye illustrated map of an overgrown abandoned Japanese rural region. ONLY terrain: patchwork meadows, scrubland, small woodland clusters, subtle ridges, a meandering jade-blue river from top-right to bottom-center, a few tiny rubble patches. Hand-painted gouache and ink on aged cream paper, tasteful earthy greens and ochre, fine terrain detail but low contrast so interactive labels can be overlaid. Wide composition 3:1, ideally 2048x768. No roads, no paths, no buildings, no landmarks, no vehicles, no people, no text, no grid, no labels, no compass rose, no borders. Leave open grassland across center for procedural road network and facility markers. Fill edge to edge; not SVG/vector artwork.
```

## landmarks

```text
Use case: stylized-concept. Asset type: transparent map landmark icon atlas for a survival RPG.
Create ONE square image divided into EXACTLY 3 columns and 3 rows of equally sized square cells. Each cell contains a small ISOMETRIC painted landmark miniature, centered within its central 70% with clear transparent padding, no overlap or border. Detailed gouache and ink, warm abandoned Japan, sage green foliage, rust and cream buildings. Exact reading order:
Row1 abandoned fuel station and tiny stretch of cracked highway; shuttered Japanese shop with faded striped awning; vine-covered clinic with a red cross sign.
Row2 small metal-roof workshop with chimney; cluster of woodland trees with small tent; dilapidated apartment block with dark windows.
Row3 pile of rusty cars and appliances; little damaged concrete river bridge above blue water; rusted communications mast with a tiny utility hut.
These are discrete isolated painted game map miniatures, NOT scenes occupying the whole cell. All objects fully inside the central 70% of their cell. Background genuinely transparent alpha, no white square panels, no checkerboard, no map, no labels, no text, no watermark. Same consistent isometric angle and scale. Ideally 1536x1536.
```

## cards

```text
Use case: stylized-concept. Asset type: nine battle-card illustrations in one production atlas.
Create a square image with exactly 3x3 EQUAL SQUARE panels, NO borders, NO gutters, NO text. Each illustration fills its cell edge to edge and reads as a small card vignette in a Japanese scavenging survival game. Warm painted gouache and ink anime game art, detailed but bold readable compositions, sage green/cream/rust-orange palette, abandoned city world, young short-haired scavenger with teal work jacket and red scarf. Exact reading order:
row1 advancing boots stepping forward along cracked road; same boots retreating defensively; closeup hand swinging a rusty knife in a single strike.
row2 dramatic closeup of a worn axe striking with force; gloved hand throwing a stone along an arcing trail; scavenger crouching behind crossed arms and a battered improvised shield.
row3 calm scavenger sitting and taking a deep breath, hand over chest; thoughtful scavenger with eyes closed and a hand at temple; scavenger running away along a ruined street.
Each panel is a standalone vignette, nobody crosses panels, no readable letters, no UI or card frame, no numbers, no labels, no watermark. Illustrated paint texture, never SVG or geometric clipart. Ideally 1536x1536.
```

## resources

```text
Use case: stylized-concept. Asset type: six small transparent resource inventory icons for a Japanese scavenging game.
One 3-column by 2-row atlas, equal square cells, each icon entirely centered in its cell with at least 20% transparent margin and no overlap. Row1: a small worn tin of preserved food with no lettering; a translucent blue water bottle; a pile of useful rusty gears and scrap metal. Row2: a folded roll of olive fabric; a red fuel jerrycan; a cream first aid kit with red cross.
Gouache and ink anime game item illustration, clear strong silhouettes for display at 24px, warm earthy palette matching a painted abandoned-world RPG, minimal fine details. Each is a standalone object. No labels, no text, no borders, no checkerboard, no drop shadow outside cell, no watermarks, genuine transparent alpha background. Exactly six icons. Square atlas 1024x1024.
```

## ファイルと用途

| ファイル | 用途 |
|---|---|
| assets/art/backgrounds.webp | 9種類の背景、3列×3行 |
| assets/art/player-outfits.webp | 頭装備3種類×服4種類、4列×3行 |
| assets/art/weapons.webp | 武器6種類、3列×2行 |
| assets/art/enemies.webp | 敵3種類、3列×1行 |
| assets/art/van.webp | 移動拠点 |
| assets/art/terrain.webp | 地図の地形 |
| assets/art/landmarks.webp | 地図の施設9種類、3列×3行 |
| assets/art/cards.webp | 戦闘カード9種類、3列×3行 |
| assets/art/resources.webp | 資源6種類、3列×2行 |

CSSでアトラスの各区画を表示します。道路の接続のみCanvasで描画し、移動ボタンは通常のHTML要素です。ゲームの乱数を消費しません。武器の「長すぎる」修飾子は持った画像の倍率にも反映します。設備は車に設備バッジを重ねて表示します。
