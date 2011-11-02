/**
 * one light module for non-utf8 encode file I/O.
 * because nodejs don't support non-utf8 encode.
 * depends on  iconv module to implement encode convert.
 * @version  1.0
 * @author   jenkinv(jenkinv.a@gmail.com)
 * ==========================================================================================
 */
var fs = require('fs'),
    ps = require('path'),
    Iconv = require('iconv').Iconv;
var __sp = /^\s*$/,
    __sl = /\\/g,
    __tr = /(?:^\s+)|(?:\s+$)/g,
    __cm = /^\s*\/\*.*?\*\/\s*$/,
    __encode = 'utf8';
var __trim = function(_content){
	return _content.replace(__tr,'');
},
    __stringToLine = function(_str){
        return _str.split('\n');
    };
// interface
exports.fh={
	// read file
	_$read : function(_src,_noJ,_noT,_srcEncode){
        var other_to_utf8;
        if(!!_srcEncode && (_srcEncode.replace('-','').toLowerCase() != 'utf8')) {
            other_to_utf8 = new Iconv(_srcEncode, 'utf8');
        }
	    try{
	        var _arr = [],_line = '',_tmp=[],
	            buffer = fs.readFileSync(_src),_str;
            _str = !!other_to_utf8 ? other_to_utf8.convert(buffer).toString() : buffer.toString();
            _tmp = __stringToLine(_str);
	        for(var i=0,l=_tmp.length,_line;i<l;i++){
	              _line = _noT?_tmp[i]:__trim(_tmp[i]);
	              if (__sp.test(_line) || __cm.test(_line)) continue;
	              _arr.push(_noJ?_line:(_line.replace(/\\$/,'')+' '));
	        }     return _noJ ? _arr : _arr.join('');
	    }catch(e){console.error(e.message);return false;}finally{}
    },
    _$dump : function(_src, _srcEncode){
        var other_to_utf8;
        if(!!_srcEncode && (_srcEncode.replace('-','').toLowerCase() != 'utf8')) {
            other_to_utf8 = new Iconv(_srcEncode, 'utf8');
        }
        try{
            var buffer = fs.readFileSync(_src),_str;
            _str = !!other_to_utf8 ? other_to_utf8.convert(buffer).toString() : buffer.toString();
            return __stringToLine(_str);           
        }catch(e){alert(e.message);return false;}finally{}
    },
	// write file
	_$write : function(_src,_content, _srcEncode){
        var utf8_to_other;
        if(!!_srcEncode && (_srcEncode.replace('-','').toLowerCase() != 'utf8')) {
            utf8_to_other = new Iconv('utf8', _srcEncode);
        }
        try{
            var buffer = new Buffer(_content);
            if(!!utf8_to_other) {
                buffer = utf8_to_other.convert(buffer);
            }
            fs.writeFileSync(_src, buffer);
            return true;
        }catch(e){console.error(e.message);return false;}
	},
	// copy file
	_$copy : function(_src,_dst,_isfold){
        try{
 
			var util = require('util');
		
			var is = fs.createReadStream(_src)
			var os = fs.createWriteStream(_dst);
			
			util.pump(is, os, function(_error) {
				if(!!_error) console.log(_error);
			});
			return true;
        }catch(e){console.error(e.message);return false;}
	},
	// list file
	_$list : function(_dir,_onm,_reg){
        _dir = _dir.replace(/\/$/,'');
        _dir+='/';
        try{
            var _arr=[],_all = fs.readdirSync(_dir);
            for(var _file,i=0,l=_all.length;i<l;i++){
                _file = _all[i];
                if(!fs.statSync(_dir+_file).isFile()) continue;
                if (!!_reg&&!_reg.test(_file)) continue;
                !!_onm ? _arr.push(_file) : _arr.push((_dir+_file).replace(__sl,'/'));
            }
            return _arr;
        }catch(e){ console.log(e);return null;}
	},
	// list folders
	_$dir : function(_dir,_onm,_reg){
        _dir = _dir.replace(/\/$/,'');
        _dir+='/';
        try{
            var _arr=[],_all = fs.readdirSync(_dir);
            for(var _file,i=0,l=_all.length;i<l;i++){
                _file = _all[i];
                if(!fs.statSync(_dir+_file).isDirectory()) continue;
                if (_reg&&!_reg.test(_file)) continue;
                !!_onm ? _arr.push(_file) : _arr.push((_dir+_file).replace(__sl,'/'));
            }
            return _arr;
        }catch(e){return null;}
	},
    // move file or folder
    _$move : function(_src,_dst,_isfile){
        try{
            fs.renameSync(_src, _dst);
            return true;
        }catch(e){return false;}
    },
	// create file or folder
	_$create : function(_src,_isfile){
        try{
            !!_isfile ? fs.writeFileSync(_src,'','utf8')
                      : fs.mkdir(_src,'0777');
            return true;
        }catch(e){return false;}
	},
	// delete file or folder
	_$delete : function(_src,_isfile){
        try{
            !!_isfile ? fs.unlinkSync(_src)
			          : fs.rmdirSync(_src);
            return true;
        }catch(e){console.error(e.message);return false;}
	},
	// delete all by regex
	_$deleteByWildCard : function(_dir, _regex){
		var _files =this._$list(_dir, false , _regex),i=0,l=_files.length;
		for(;i<l;i++) this._$delete(_files[i], true);
	},
	// rename file or folder
	_$rename : function(_src,_name,_isfile){
        try{
            if (!_name) return false;
			var _dst;
            if(!!_isfile){
                _dst = _src.replace(/\/[^\/\.]+/,_name);
            }else {
                _dst = _src.replace(/\/.+\/?/,'/'+_name);
            }
            return this._$move(_src, _dst, _isfile);
        }catch(e){return false;}
	},
	// has file or folder
	_$has : function(_src,_isfile){
        return ps.existsSync(_src);
	},
	// last modified time
	_$getTime : function(_src,_isfile){
		try{
			return fs.statSync(_src).mtime.getTime();
		}catch(e){
			return new Date().getTime();
		}
	},
	// can use filesystemobject
	b : function(){
		return !!fs;
	}
};
