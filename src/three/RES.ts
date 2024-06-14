import paint_scroll from "@models/paint_scroll.glb"; // 无图
import env from "@textures/env/env15.jpg";
import dissolveRamp from "@textures/dissolveRamp.png";
import dissolveTex from "@textures/dissolveTex.png";
import smoke from "@textures/smoke/smoke5.png";
import smoke3 from "@textures/smoke/smoke6.png";
import noise from "@textures/noise.png";

import p1 from "@textures/paints/p1.jpg";
import p2 from "@textures/paints/p2.jpg";
import p3 from "@textures/paints/p3.jpg";
import p4 from "@textures/paints/p4.jpg";
import p5 from "@textures/paints/p5.jpg";
import p6 from "@textures/paints/p6.jpg";
import p7 from "@textures/paints/p7.jpg";
import p8 from "@textures/paints/p8.jpg";
// import p9 from "@textures/paints/p9.jpg";
import p10 from "@textures/paints/p10.jpg";
import p11 from "@textures/paints/p11.jpg";
import p12 from "@textures/paints/p12.jpg";
import p13 from "@textures/paints/p13.jpg";

import mountains from "@models/mountains.glb";
import stonepillar from "@models/stonepillar2.glb";

import test from "@models/test.glb";

// import test_model from "@models/test_model.glb";
import test_texture from "@textures/test.jpg";
import testPlane from "@models/testPlane.glb";
// import ss5 from "@models/ss5.glb";
export default {
    gltfs: {
        paint_scroll, //
        // paint_scroll_2,
        // ss5,
        testPlane,
        mountains,
        stonepillar,
        test,
    },
    textures: {
        dissolveRamp,
        dissolveTex,
        env,
        paints: {
            "1": p1,
            "2": p2,
            "3": p3,
            "4": p4,
            "5": p5,
            "6": p6,
            "7": p7,
            "8": p8,
            // 9:p9,
            "10": p10,
            "11": p11,
            "12": p12,
            "13": p13,
        },
        smoke,
        smoke3,
        noise,
    },
    audios: {},
    // hdr: { env },
};
