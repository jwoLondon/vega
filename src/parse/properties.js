vg.parse.properties = (function() {
  function compile(spec) {
    var code = "",
        names = vg.keys(spec),
        i, len, name, ref, vars = {};
        
    code += "var o = trans ? {} : item;\n"
    
    for (i=0, len=names.length; i<len; ++i) {
      ref = spec[name = names[i]];
      code += (i > 0) ? "\n  " : "  ";
      code += "o."+name+" = "+valueRef(name, ref)+";";
      vars[name] = true;
    }
    
    if (vars.x2) {
      if (vars.width) {
        code += "\n  o.x = (o.x2 - o.width);";
      } else if (vars.x) {
        code += "\n  if (o.x > o.x2) { "
              + "var t = o.x; o.x = o.x2; o.x2 = t; };";
        code += "\n  o.width = (o.x2 - o.x);";
      }
    }

    if (vars.y2) {
      if (vars.height) {
        code += "\n  o.y = (o.y2 - o.height);";
      } else if (vars.y) {
        code += "\n  if (o.y > o.y2) { "
              + "var t = o.y; o.y = o.y2; o.y2 = t; };";
        code += "\n  o.height = (o.y2 - o.y);";
      }
    }
    
    code += "if (trans) trans.interpolate(item, o);";

    return Function("item", "group", "trans", code);
  }

  function valueRef(name, ref) {
    if (ref == null) return null;
    var isColor = name==="fill" || name==="stroke";

    if (isColor) {
      if (ref.c) {
        return colorRef("hcl", ref.h, ref.c, ref.l);
      } else if (ref.h || ref.s) {
        return colorRef("hsl", ref.h, ref.s, ref.l);
      } else if (ref.l || ref.a) {
        return colorRef("lab", ref.l, ref.a, ref.b);
      } else if (ref.r || ref.g || ref.b) {
        return colorRef("rgb", ref.r, ref.g, ref.b);
      }
    }

    // initialize value
    var val = "item.datum.data";
    if (ref.value !== undefined) {
      val = vg.str(ref.value);
    }

    // get field reference for enclosing group
    if (ref.group != null) {
      var grp = vg.isString(ref.group) ? "["+vg.str(ref.group)+"]" : "";
    }

    // get data field value
    if (ref.fieldref != null) {
      val = "vg.accessor(group.datum["
          + vg.field(ref.fieldref).map(vg.str).join("][")
          + "])(item.datum.data)";
    } else if (ref.field != null) {
      val = vg.field(ref.field).map(vg.str).join("][");
      val = ref.group != null
        ? "group.datum" + grp + "[item.datum[" + val + "]]"
        : "item.datum[" + val + "]";
    } else if (ref.group != null) {
      val = "group[" + grp + "]";
    }
    
    // run through scale function
    if (ref.scaleref != null || ref.scale != null) {
      var scale = ref.scaleref != null
        ? "group.scales[item.datum["+vg.str(ref.scaleref)+"]]"
        : "group.scales["+vg.str(ref.scale)+"]";
      if (ref.band) {
        val = scale + ".rangeBand()";
      } else {
        val = scale + "(" + val + ")";
      }
    }
    
    // multiply, offset, return value
    return "((" + (ref.mult ? (vg.number(ref.mult)+" * ") : "") + val + ")"
      + (ref.offset ? " + " + vg.number(ref.offset) : "") + ")"
      + (isColor ? '+""' : "");
  }
  
  function colorRef(type, x, y, z) {
    var xx = x ? valueRef(x) : vg.config.color[type][0],
        yy = y ? valueRef(y) : vg.config.color[type][1],
        zz = z ? valueRef(z) : vg.config.color[type][2];
    return "(d3." + type + "(" + [xx,yy,zz].join(",") + ') + "")';
  }
  
  return compile;
})();