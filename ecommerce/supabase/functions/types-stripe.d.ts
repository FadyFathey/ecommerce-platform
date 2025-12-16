// Ambient declaration to make TypeScript tooling understand the Deno npm: specifier
// used in Supabase Edge Functions. At runtime, Deno will resolve "npm:stripe@16.6.0"
// from npm, so we only need a minimal type here to satisfy the editor/TS checker.
declare module "npm:stripe@16.6.0" {
  // Use 'any' to avoid depending on local Stripe type packages.
  const Stripe: any;
  export default Stripe;
}


