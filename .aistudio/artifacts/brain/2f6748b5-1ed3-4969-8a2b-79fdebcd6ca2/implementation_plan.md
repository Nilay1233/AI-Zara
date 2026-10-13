# Universal Animated Mute / Unmute Toggle Button

A dedicated, animated Mute/Unmute button positioned in the top navigation bar beside the UI Mode switcher, applying seamlessly across all 6 UI themes with spring pulse bouncing, glowing ripple rings, and real-time microphone stream management.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The following design and functional choices were confirmed during interactive clarification and govern the implementation:

- **Placement**: Top bar directly adjacent to the UI Mode switcher (`UIModeButton`), ensuring persistent visibility and easy thumb/click access regardless of which of the 6 UI themes is active.
- **Click Animation**: Spring pulse bounce (`scale: [1, 0.88, 1.15, 0.98, 1]`) combined with an expanding radiant ripple ring (`scale: 1.8`, `opacity: 0`) and color transitions (emerald active mic vs. rose-red muted mic).
- **Audio Scope**: Mutes the microphone input stream while keeping Zara's synthesized live voice audio fully audible.
- **State Synchronization**: Bidirectionally synchronized with existing orb/sub-view mute indicators so any mute toggle instantly updates all views.

---

### 1. Overview & Core Concept

- **What It Does**: Adds a tactile, single-click toggle button labeled "Mute" / "Unmute" (with dynamic mic icons and state tooltips) that mutes the browser's incoming audio track in the active Gemini Live WebRTC/WebSocket session without disconnecting or silencing Zara's answers.
- **Target Audience / Persona**: Users conversing with Zara across any of the 6 UI modes (Classic Cyberpunk, Glass Neo, Minimalist Zen, Cosmic Void, Retro Terminal, Ambient Vaporwave) who need immediate privacy control over their microphone.
- **Key Value**: Provides an unmistakable, animated privacy toggle that guarantees zero audio leakage while listening to Zara, elevated by satisfying tactile micro-interactions.

---

### 2. User Experience & Visual Design

#### Key User Flows
1. **Default / Unmuted State**:
   - The button sits beside the UI Mode button with an emerald glowing mic indicator, subtle glass background, and text: "Mic On".
   - Hovering triggers a gentle elevation lift and subtle glow intensification.
2. **Clicking the Mute Toggle**:
   - On click, a spring bounce animation fires: the button quickly compresses and rebounds with overshoot physics using `motion/react`.
   - Simultaneously, a luminous shockwave ripple ring radiates outward and fades.
   - The microphone track in `AudioStreamer` is cleanly disabled (`track.enabled = false`), preventing microphone transmission.
   - The button shifts into the muted state: rose-red gradient accent, `MicOff` icon, and text: "Muted".
   - A transient tooltip/badge displays "Microphone muted (Zara can still speak)".
3. **Clicking to Unmute**:
   - The button bounces again with an emerald ripple burst.
   - The microphone track is re-enabled (`track.enabled = true`).
   - The button displays active state with live audio level reactivity.

#### Visual Identity & Theme Harmonization
```
┌────────────────────────────────────────────────────────────────────────┐
│ TOP BAR HEADER                                                         │
│                                                                        │
│  [✦ Zara Voice AI]     [UI Style: Glass Neo (6 UIs)]  [🎙️ Mic On / 🔇]  │
│                                         ▲                    ▲         │
│                                   UIModeButton       New MuteButton    │
└────────────────────────────────────────────────────────────────────────┘
```

- **Color Tokens**:
  - Unmuted: Emerald accent `#10b981`, emerald glow halo `rgba(16, 185, 129, 0.35)`, dark slate glass surface.
  - Muted: Rose accent `#f43f5e`, rose glow halo `rgba(244, 63, 94, 0.4)`, high-contrast warning badge.
- **Motion & Micro-interactions**:
  - `whileTap={{ scale: 0.92 }}`
  - Spring physics: `stiffness: 400, damping: 17`
  - Keyframe ripple ring: `opacity: [0.8, 0]`, `scale: [0.9, 1.7]` over 450ms.
- **Touch Target & Layout**:
  - Touch target $\ge 40\text{px}$ height (`py-2 px-3.5`), single-line container with non-wrapping flex layout.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Direct Component vs. Top Bar Container Integration**
  - *Chosen Approach*: Build a dedicated reusable component `<MuteToggleButton />` and mount it directly beside `<UIModeButton />` in `App.tsx`'s top navigation bar.
  - *Why*: Ensures consistent presentation across all 6 UI themes without duplicating code in individual theme views.
  - *Alternatives Considered*: Floating floating-action-button (FAB) in the corner was rejected to avoid obscuring existing quick action sidebars and website action cards.

- **Decision 2: Audio Track Disabling vs. Stream Severing**
  - *Chosen Approach*: Toggle `MediaStreamTrack.enabled = false/true` in `AudioStreamer` and notify `LiveSession`.
  - *Why*: Instantaneous zero-latency mute without having to renegotiate hardware microphone permissions or recreate audio context nodes.
  - *Alternatives Considered*: Closing audio context; would cause audible pops and slow unmute latency.

---

### 4. Technical Architecture & Data Strategy

```
┌──────────────────────────────────────────────────────────────┐
│                         App.tsx                              │
│  State: [isMuted, setIsMuted] ◄──► [handleToggleMute]        │
└──────────────┬───────────────────────────────┬───────────────┘
               │                               │
               ▼                               ▼
     ┌──────────────────┐            ┌───────────────────┐
     │  Top Navigation  │            │  Theme Content    │
     │  - UIModeButton  │            │  - ZaraOrb        │
     │  - MuteToggleBtn │            │  - ModernNewUI    │
     └─────────┬────────┘            └───────────────────┘
               │
               ▼ Click Event (triggers spring animation + ripple)
     ┌─────────────────────────────────────────────────┐
     │ LiveSession.setMute(nextMuted)                  │
     │ └─► AudioStreamer.setMute(nextMuted)            │
     │      └─► stream.getAudioTracks()[0].enabled     │
     └─────────────────────────────────────────────────┘
```

#### Component & State Mapping
1. **`src/components/MuteToggleButton.tsx`**:
   - Props: `isMuted: boolean`, `onToggle: () => void`, `state: ZaraState`, `isVirtualMode: boolean`.
   - Motion variants: `tapBounce`, `rippleEffect`.
   - Keyboard accessible: Enter / Space triggers toggle.
2. **`src/App.tsx`**:
   - Embed `<MuteToggleButton>` in the top header alongside `<UIModeButton>`.
   - Connect to existing `handleToggleMute` callback.
   - Pass mute state down to all 6 UI view modes.
3. **Verification**:
   - Build validation with `compile_applet` and `lint_applet`.
   - Verify click responsiveness, ripple visualizer, and microphone input muting in browser.
