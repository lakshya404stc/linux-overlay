# Keeps X11 windows fully click-through by setting an empty input shape.
# Chromium can reset the shape when the window is mapped/restacked, so re-apply
# every 0.5s until the parent (Electron) process exits.
import ctypes, os, sys, time
X = ctypes.CDLL('libX11.so.6'); Xe = ctypes.CDLL('libXext.so.6')
X.XOpenDisplay.restype = ctypes.c_void_p
X.XFlush.argtypes = [ctypes.c_void_p]
X.XSetErrorHandler.argtypes = [ctypes.c_void_p]
Xe.XShapeCombineRectangles.argtypes = [ctypes.c_void_p, ctypes.c_ulong, ctypes.c_int, ctypes.c_int,
                                       ctypes.c_int, ctypes.c_void_p, ctypes.c_int, ctypes.c_int, ctypes.c_int]
ERR = ctypes.CFUNCTYPE(ctypes.c_int, ctypes.c_void_p, ctypes.c_void_p)(lambda d, e: 0)
X.XSetErrorHandler(ERR)  # ignore BadWindow once a window is gone
d = X.XOpenDisplay(None)
parent = int(sys.argv[1])
wids = [int(w) for w in sys.argv[2:]]

class WMHints(ctypes.Structure):
    _fields_ = [('flags', ctypes.c_long), ('input', ctypes.c_int), ('initial_state', ctypes.c_int),
                ('icon_pixmap', ctypes.c_ulong), ('icon_window', ctypes.c_ulong), ('icon_x', ctypes.c_int),
                ('icon_y', ctypes.c_int), ('icon_mask', ctypes.c_ulong), ('window_group', ctypes.c_ulong)]
X.XSetWMHints.argtypes = [ctypes.c_void_p, ctypes.c_ulong, ctypes.POINTER(WMHints)]
for wid in wids:  # never take keyboard focus
    X.XSetWMHints(d, wid, ctypes.byref(WMHints(flags=1, input=0)))  # InputHint, input=False
while True:
    try:
        os.kill(parent, 0)
    except OSError:
        break
    for wid in wids:
        Xe.XShapeCombineRectangles(d, wid, 2, 0, 0, None, 0, 0, 0)  # ShapeInput, no rects, ShapeSet
    X.XFlush(d)
    time.sleep(0.5)
