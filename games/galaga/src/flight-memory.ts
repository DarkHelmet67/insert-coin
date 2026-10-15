import { FLIGHT_ROM } from './rom/flight-rom';

/**
 * The data areas of the second processor's ROM as one sparse memory, addressed like the
 * original: flight programs jump to each other by address.
 */
const MEMORY: ReadonlyMap<number, number> = new Map(
  FLIGHT_ROM.flatMap((area) => area.bytes.map((byte, index) => [area.address + index, byte])),
);

/**
 * The byte at `address`. Reading outside the data areas would be a bug in a flight program
 * or in the remake: it reads $FF, the "stop flying" command, so the alien just disappears.
 */
export const romByte = (address: number): number => MEMORY.get(address & 0xffff) ?? 0xff;

/** The little-endian 16-bit word at `address`. */
export const romWord = (address: number): number => romByte(address) | (romByte(address + 1) << 8);

/** Address of the formation layout copied into this ROM: (row, column) per object. */
const FORMATION_LAYOUT = 0x0100;

/**
 * Where object `id` rests in the formation: the indexes of its row and column in the
 * formation tables (`sprt_fmtn_hpos`). Columns are 0-9, rows 10-15.
 */
export const homeCell = (id: number): { readonly row: number; readonly column: number } => ({
  row: romByte(FORMATION_LAYOUT + (id & 0x7e)) >> 1,
  column: romByte(FORMATION_LAYOUT + (id & 0x7e) + 1) >> 1,
});
