export function smokeGreeting(name: string): string {
  return `PlainUI toolchain ready: ${name}`;
}

export function setSmokeText(element: HTMLElement): void {
  element.textContent = smokeGreeting('browser');
}
