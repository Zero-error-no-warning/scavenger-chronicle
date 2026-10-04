# 0.1.4 トゥーン系の生成画像素材

組み込みの画像生成ツール（built-in imagegen）で制作。元のPNGを編集せず、配信用WebPへの形式変換だけImageMagickで実施。透明素材のアルファを維持。

## 絵柄の必須条件

ユーザー指定のパワーパフガールズ風のトゥーン系が制作基準。オリジナルのキャラクターを、大きな丸い頭と目、短い手足、太い黒輪郭、単純な色面で表現。背景も大きな幾何形状で整理。水彩・写実・通常のアニメ体型・3Dへ変更しない。絵柄を別の雰囲気に置き換える解釈をしない。

## 最終素材

| 配信用ファイル | 生成PNG |
|---|---|
| `assets/art/backgrounds.webp` | `/workspace/scratch/9c8a2d707cd7/generated_images/exec-a07e32f8-ad97-4b34-8bc9-dc43960efbaf.png` |
| `assets/art/player-outfits.webp` | `/workspace/scratch/9c8a2d707cd7/generated_images/exec-f5a6f354-ab24-4186-b794-79f2ccde0563.png` |
| `assets/art/weapons.webp` | `/workspace/scratch/9c8a2d707cd7/generated_images/exec-3cf05ad6-7b8e-4208-a630-0ae55f14d549.png` |
| `assets/art/enemies.webp` | `/workspace/scratch/9c8a2d707cd7/generated_images/exec-36ca27c6-d81d-429a-bc9d-82ffbed7bfdb.png` |
| `assets/art/van.webp` | `/workspace/scratch/9c8a2d707cd7/generated_images/exec-472ddf07-27f1-4514-a752-e305122624e3.png` |
| `assets/art/terrain.webp` | `/workspace/scratch/9c8a2d707cd7/generated_images/exec-ce02f92b-9610-40e8-9196-3bad33f7fa20.png` |
| `assets/art/landmarks.webp` | `/workspace/scratch/9c8a2d707cd7/generated_images/exec-6b929d4b-cf37-467b-9956-75d11131ae12.png` |
| `assets/art/cards.webp` | `/workspace/scratch/9c8a2d707cd7/generated_images/exec-3fe7fed2-49a6-47c7-9710-d17e03b20177.png` |
| `assets/art/resources.webp` | `/workspace/scratch/9c8a2d707cd7/generated_images/exec-923f317e-cca7-4e11-8ea6-62e012e570a1.png` |

## backgrounds

### backgrounds-simple

```text
REMAKE game background atlas in EXTREMELY SIMPLE flat 1960s-UPA / Powerpuff Girls TV cartoon BACKGROUND style. Not anime scenery. Nine panels exact 3x3 atlas, each panel16:9, overall16:9canvas. Entire panels edge-to-edge NO gutters or borders. Chunky off-kilter angular buildings, thick jet-black outer contours, giant simple geometric color fields, trees as simple three-lobed silhouettes, grass as only a few bold spikes. MAXIMUM 15-25 large shapes per panel. Flat cream, teal, orange and sage palette. Absolutely NO tiny rubble, texture marks, detailed leaves, scratches, detailed windows, realistic perspective, gradients, soft shading, atmospheric painting or watercolor. Simple abandoned-world stage with clear open flat foreground bottom third for separate actors. No people, animals or campervan. Row1 highway and abandoned gas station; shuttered small shopfront street; tiny red-cross clinic. Row2 squat workshop with chimney; simple forest and tent; leaning apartment blocks. Row3 cartoon car/appliance scrap pile; tiny blue river under broken bridge; short communications mast and hut. Very graphic clean minimalist TV animation set backgrounds, bold large flat shapes.
```

## player-outfits

### player

```text
Create a production transparent PNG SPRITE ATLAS for an original survival game. STRICT visual style: Powerpuff Girls-like late-1990s flat 2D TV cartoon language. Huge round heads, ENORMOUS simple expressive black-and-white eyes, tiny torsos and extremely short stubby arms and legs, about TWO heads tall. Very thick smooth BLACK contours, bold simple geometric silhouettes, completely FLAT solid fills, at most one hard-edged shadow. Absolutely NO watercolor, brush texture, painterly shading, realism, 3D, gradients or conventional anime anatomy. Original character, not any existing Powerpuff character. Warm cream, sage teal, rusty orange, mustard palette.
EXACT 4 columns by 3 rows of equal portrait cells, each cell aspect 2:3; overall canvas aspect 8:9. Twelve complete full-body sprites, same scale, same baseline, identical pose. Every sprite fully inside its cell with generous empty transparent padding; no lines, labels or borders. Protagonist is a cute determined scavenger with short dark hair, giant eyes, rust scarf, tiny brown boots and small backpack, facing viewer's RIGHT in three-quarter view. Hand on image RIGHT is EMPTY and held just forward beside the waist, ready to hold a separate vertical tool. No weapons. ROW 1 all wear rusty red cap; ROW 2 all wear mustard construction helmet; ROW 3 all have goggles on forehead and NO hat. COLUMNS consistently: 1 teal workcoat; 2 orange puffer jacket; 3 slate protective vest; 4 mustard raincoat. Make outfit/headgear clearly different and identical protagonist face in all 12. Smooth bold cartoon art with genuinely huge head, huge eyes and tiny body. Clean alpha background.
```

## weapons

### weapons

```text
Production transparent PNG game item atlas. undefined EXACT 3 columns x2 rows, whole SQUARE canvas, cells portrait aspect2:3. Six vertical isolated complete tools, all safely contained inside cells with 15% alpha padding. ROW1: straw broom with handle above and bristles below; steel knife blade above leather grip; rusty bent pipe. ROW2: hand axe steel blade at top; open BLUE umbrella with hooked handle below; digging shovel D grip above and spade below. Clean graphic shapes, thick black outlines, flat colors, no texture. Each tool's usable grip should sit near the VERTICAL CENTER of the cell. No hands, characters, text, labels, border, background, cast shadow or glow.
```

### weapons-spacing

```text
Edit attached six-tool atlas for safe sprite extraction. Maintain EXACTLY 3columns x2rows, square canvas, six same tools in same order and vertical orientation: broom, knife, pipe; axe, open blue umbrella, shovel. Every entire silhouette must fit within CENTRAL70% of its cell, with TRANSPARENT borders around each cell. Scale umbrella down considerably so NO edge crosses into axe or shovel cells. Center each item horizontally. Use thick smooth black outlines and clean solid cartoon colors, remove rust texture speckles and soft gradients, use only simple flat color patches. No background, hands, text, borders or shadows.
```

## enemies

### enemies

```text
Production game SPRITE ATLAS. STRICT Powerpuff Girls-like late-1990s flat 2D TV cartoon visual language: very thick clean BLACK outlines, playful simple geometric shapes, bold flat solid color fills, minimal hard-edged shadows. Huge heads and enormous black-white expressive eyes for creatures, tiny limbs. Original designs. NO painterly or watercolor textures, no gradients, realism, 3D, anime anatomy or realistic detail. Cream, sage teal, rust orange and mustard palette. Transparent PNG, EXACTLY 3 square cells across ONE row, overall 3:1 canvas. Three complete full-body enemies ALL facing viewer LEFT, generous alpha margins. Every silhouette must fit entirely within CENTRAL 75% of its own cell, no overlap across cell boundaries including tails or weapons. LEFT: scruffy tan feral dog, huge round head, massive expressive eyes, tiny legs and curved tail. CENTER: original hostile scavenger with huge round head, giant eyes, rust headscarf, tiny stocky body, green clothes and short club tucked entirely inside cell. RIGHT: damaged sage-green maintenance robot with huge round head and orange round eyes, tiny body and short arms/legs. Bold cute-but-threatening TV-cartoon shapes, clear clean alpha, no background, floor, shadow, border or text.
```

### enemies-spacing

```text
Edit this enemy atlas ONLY to improve sprite cell safety. Preserve exact character identities, poses, huge eyes and heads, thick black contours and flat cartoon colors. Canvas exactly THREE equal SQUARE CELLS in ONE horizontal row, aspect3:1. Scale ALL three whole characters down to fit ENTIRE silhouettes within CENTRAL70% of each square cell. Dog tail must NOT approach or cross first cell boundary. Raider club must be fully inside middle cell. Robot antenna/claws fully inside right cell. Feet baseline80%cellheight, center horizontally. Genuine alpha transparent margins. No borders, labels, shadows or backgrounds. Absolutely no style change or additional texture.
```

## van

### van

```text
Production game asset, single original patched sage green and cream CAMPER VAN, facing viewer RIGHT, broadside three-quarter view. STRICT Powerpuff Girls-like late-1990s flat 2D TV cartoon visual language: very thick clean BLACK outlines, playful simple geometric shapes, bold flat solid color fills, minimal hard-edged shadows. Huge heads and enormous black-white expressive eyes for creatures, tiny limbs. Original designs. NO painterly or watercolor textures, no gradients, realism, 3D, anime anatomy or realistic detail. Cream, sage teal, rust orange and mustard palette. Very chunky rounded cartoon body, big simple wheels, warm orange window, little rooftop crate and folded tarp, one cheerful bird sticker. Entire complete silhouette comfortably inside canvas with 12% transparent margins. No people, no text, no ground, no glow, no cast shadow, no background. Transparent PNG, landscape 3:2 canvas. Flat outlined TV cartoon vehicle with simple graphic details.
```

### van-clean

```text
Edit attached cartoon van. Keep the exact vehicle silhouette, bird sticker, direction and thick black contours. Flatten all colors into clean solid color fills with a single hard-edged shadow tone: no gradients or soft illumination. REMOVE EVERY glow, halo, haze, shadow and colored pixels OUTSIDE the black vehicle silhouette. Outside contours must be purely TRANSPARENT alpha, including space around roof, wheels and bumpers; no soft colored halo whatsoever. Keep entire van inside canvas, landscape3:2. Clean TV cartoon production sprite for compositing.
```

## terrain

### terrain-simple

```text
Production wide3:1 regional-map BACKGROUND for a Powerpuff Girls-like flat TV CARTOON game. EXTREMELY SIMPLE graphic composition: flat sage-green central plain covering70% image, a winding BLUE RIBBON river entering top-right and leaving bottom-center, a FEW small groups of trees at outer edges. Trees are just large three-lobed dark green silhouettes with a single black branching line each. Ridge upperleft just3 simple angular gray triangles. Thick smooth BLACK contours. Colors perfectly solid flat fills, tiny hard shadow patches only. No gradients, painterly grass, small leaves, hundreds of trees, realism, 3D or texture. Use only about25-35 bold large shapes for ENTIRE image. Open empty center for overlay of generated roads/buildings. No roads, buildings, text, grid, pins, UI or characters. Clean opaque raster TV-animation background.
```

## landmarks

### landmarks

```text
Production transparent PNG MINIATURE MAP LANDMARK ATLAS. STRICT Powerpuff Girls-like late-1990s flat 2D TV cartoon visual language: very thick clean BLACK outlines, playful simple geometric shapes, bold flat solid color fills, minimal hard-edged shadows. Huge heads and enormous black-white expressive eyes for creatures, tiny limbs. Original designs. NO painterly or watercolor textures, no gradients, realism, 3D, anime anatomy or realistic detail. Cream, sage teal, rust orange and mustard palette. EXACT 3 columns x3 rows of equal SQUARE cells, whole square canvas. One isolated complete cartoon isometric building/location in each cell, very simple chunky miniature, only 5-12 main shapes each, thick black outlines, NO realistic texture or foliage detail. Entire miniature INCLUDING tall towers must fit within central65% of cell with clear transparent margins and no overlaps. Row1 abandoned petrol station with small road; shuttered little shop; small red-cross clinic. Row2 small chimney workshop; 3 trees and tent; small apartment building. Row3 scrap car and appliance pile; short broken bridge over a tiny river patch; short stylized communications mast with hut. No letters, text, labels, shadows, floor across cells, borders or background. Readable map icons at50px.
```

### landmarks-spacing

```text
Edit attached map landmark atlas only to fix spacing for exact sprite extraction. SAME 3columns x3rows SQUARE CELL grid, same9 buildings in same order, same bold flat cartoon art. SCALE EVERY whole landmark to ONLY60% of a cell's width and60%height maximum (including scrapyard heap, forest trees, factory smoke, bridge river patch and tower antenna). Center each miniature in its own cell with large empty TRANSPARENT MARGIN all around. NO pixels may cross any cell boundary. Preserve true alpha, no borders, no words, no new objects or shadows. Keep existing clean thick black outline cartoon style.
```

## cards

### cards

```text
Production game action CARD ART ATLAS. STRICT Powerpuff Girls-like late-1990s flat 2D TV cartoon visual language: very thick clean BLACK outlines, playful simple geometric shapes, bold flat solid color fills, minimal hard-edged shadows. Huge heads and enormous black-white expressive eyes for creatures, tiny limbs. Original designs. NO painterly or watercolor textures, no gradients, realism, 3D, anime anatomy or realistic detail. Cream, sage teal, rust orange and mustard palette. Exact3 columns x3 rows equal SQUARE panels, whole square image, opaque each cell edge-to-edge, NO gutters, borders, letters, captions, UI or text. Simple energetic bold flat cartoon action vignettes, colorful solid cream/sage/rust backgrounds. Original cute scavenger with short dark hair, rusty red cap, teal workcoat, enormous round head and HUGE black-white eyes, tiny short body and limbs, TWO heads tall. Consistent character. Row1: boots stepping forward right; boots stepping backward left; protagonist swings a single knife. Row2: protagonist swings handaxe forcefully; protagonist throws one stone; protagonist braces behind improvised shield. Row3: protagonist catches breath with hand on chest; protagonist focuses with hand at temple; protagonist runs away. Bold clear action silhouettes, sparing black motion marks, each action entirely inside its cell, no painterly rendering or conventional anime body proportions.
```

## resources

### resources

```text
Production transparent PNG game RESOURCE ICON ATLAS. undefined EXACT 3 columns by 2 rows equal cells on a SQUARE canvas. Row1 left FOOD TIN with simple fish graphic, middle WATER BOTTLE with blue fill, right GEARS and metal scrap. Row2 left rolled OLIVE CLOTH, middle orange FUEL JERRY CAN, right cream FIRST AID KIT with single bold RED CROSS. Each complete icon in central70% of cell with empty alpha margins, NO overlaps. Very simple chunky silhouettes readable at 24px, extremely clean thick black contours and flat colors. No text, characters, labels, border, shadow, glow or background.
```
