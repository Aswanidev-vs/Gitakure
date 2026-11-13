SPRITE PACK - extracted from the 12 Gitakure concept boards
============================================================
sprites/<sheet>/individual/*.png   every sprite, transparent background, cropped tight
sprites/<sheet>/<sheet>_atlas.png  all sprites of that board packed into one transparent atlas
sprites/<sheet>/<sheet>_atlas.json frame rects (x,y,w,h) + panel/row/col grouping + original position
sprites/npc/grid/<name>_sheet.png  18 NPCs: uniform grid, 12 columns x 4 rows, bottom-center aligned
sprites/npc/grid/<name>_sheet.json cell size + animation map (idle/walk/interact x down/left/right/up)
sprites/npc/portraits/*.png        dialogue portraits (opaque)

NPC grid layout: rows = down,left,right,up. Columns 0-3 idle, 4-7 walk, 8-11 interact.

Names are panel_row_col (e.g. rpg_terrain_p03_r01_c02): panel = box on the board in reading order.
Source boards are AI-generated art, ~16-25 px sprites and not on a true pixel grid:
treat as prototype assets; scale with nearest-neighbour.
