function test1()
    print "ok"
    exec(function()
        print "ok"
    end function)
end function

function test2()
    print "ko"
    exec(function()
        print "ko"
    end function)
    return "ko"
end function

function test3() as void
    print "okko"
end function

function exec(x)
    return
    print "unreachable"
end function
