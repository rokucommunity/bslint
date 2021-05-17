function ok()
    print "ok"
    exec(function()
        print "ok"
    end function)
end function

function error()
    print "ko"
    exec(function()
        print "ko"
    end function)
    return "ko"
end function

function exec(x)
    return
    print "unreachable"
end function
