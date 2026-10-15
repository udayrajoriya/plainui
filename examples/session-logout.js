/**
 * Call resetSession before changing authentication. It advances the app's epoch,
 * cancels authenticated work, clears resource/action records and the HTTP cache,
 * and leaves declared local, store, and persisted state as it was. Clear any
 * user-specific local state explicitly if the product requires that behavior.
 * The app does not issue a fresh request until a later dependency change or an
 * explicit refresh after sign-out.
 */
export async function logout(app,signOut){
  app.resetSession();
  await signOut();
}
