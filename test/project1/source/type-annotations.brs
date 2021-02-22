function test1(arg1, arg2)
    print "noop"
end function

function test2(arg1, arg2)
    return arg1 + arg2
end function

function test3(arg1 as string, arg2 as string) as string
    return arg1 + arg2
end function
