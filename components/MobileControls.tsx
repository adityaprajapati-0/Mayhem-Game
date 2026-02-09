
import React, { useEffect, useRef } from 'react';
import { PlayerRole } from '../types';

interface MobileControlsProps {
  role: PlayerRole;
}

const MobileControls: React.FC<MobileControlsProps> = ({ role }) => {
  const joystickRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  
  const dispatchKey = (code: string, pressed: boolean) => {
    const event = new KeyboardEvent(pressed ? 'keydown' : 'keyup', { code });
    window.dispatchEvent(event);
  };

  useEffect(() => {
    const knob = knobRef.current;
    const joystick = joystickRef.current;
    if (!knob || !joystick) return;

    let dragging = false;

    const handleTouch = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = joystick.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      let dx = touch.clientX - centerX;
      let dy = touch.clientY - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = rect.width / 2;

      if (dist > maxDist) {
        dx = (dx / dist) * maxDist;
        dy = (dy / dist) * maxDist;
      }

      knob.style.transform = `translate(${dx}px, ${dy}px)`;

      dispatchKey('KEYW', dy < -15);
      dispatchKey('KEYS', dy > 15);
      dispatchKey('KEYA', dx < -15);
      dispatchKey('KEYD', dx > 15);
    };

    const handleEnd = () => {
      knob.style.transform = `translate(0, 0)`;
      dispatchKey('KEYW', false);
      dispatchKey('KEYS', false);
      dispatchKey('KEYA', false);
      dispatchKey('KEYD', false);
    };

    joystick.addEventListener('touchstart', (e) => { dragging = true; handleTouch(e); });
    joystick.addEventListener('touchmove', (e) => { if (dragging) handleTouch(e); });
    joystick.addEventListener('touchend', () => { dragging = false; handleEnd(); });

    return () => {};
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[60]">
      {/* Joystick area */}
      <div 
        ref={joystickRef}
        className="absolute bottom-16 left-16 w-36 h-36 bg-black/40 backdrop-blur-xl rounded-full border border-white/10 pointer-events-auto flex items-center justify-center shadow-2xl"
      >
        <div ref={knobRef} className="w-14 h-14 bg-white/20 rounded-full border border-white/40 shadow-xl"></div>
      </div>

      {/* Look Area Info (Visual guide only) */}
      <div className="absolute top-1/2 right-10 -translate-y-1/2 text-white/20 text-[10px] uppercase font-black tracking-widest pointer-events-none">
        Swipe to Look
      </div>

      {/* Action Buttons */}
      <div className="absolute bottom-16 right-16 flex flex-col gap-6 pointer-events-auto items-end">
        {role === PlayerRole.MOSQUITO && (
          <div className="flex gap-4">
             <button 
              onTouchStart={() => dispatchKey('SPACE', true)}
              onTouchEnd={() => dispatchKey('SPACE', false)}
              className="w-20 h-20 bg-white/5 rounded-2xl border border-white/10 text-xs font-black uppercase tracking-widest text-zinc-400 active:bg-white/20"
            >
              Rise
            </button>
            <button 
              onTouchStart={() => dispatchKey('SHIFTLEFT', true)}
              onTouchEnd={() => dispatchKey('SHIFTLEFT', false)}
              className="w-20 h-20 bg-white/5 rounded-2xl border border-white/10 text-xs font-black uppercase tracking-widest text-zinc-400 active:bg-white/20"
            >
              Sink
            </button>
          </div>
        )}

        <button 
          onTouchStart={() => {
            if (role === PlayerRole.HUMAN) {
               window.dispatchEvent(new MouseEvent('mousedown'));
            } else {
               dispatchKey('KEYE', true);
            }
          }}
          onTouchEnd={() => {
            if (role === PlayerRole.MOSQUITO) dispatchKey('KEYE', false);
          }}
          className="w-40 h-40 bg-red-600/90 backdrop-blur-md border-4 border-red-500 rounded-full flex items-center justify-center font-black text-2xl text-white shadow-[0_0_50px_rgba(220,38,38,0.5)] active:scale-90 transition-transform"
        >
          {role === PlayerRole.HUMAN ? 'ZAP' : 'FEED'}
        </button>
      </div>
    </div>
  );
};

export default MobileControls;
