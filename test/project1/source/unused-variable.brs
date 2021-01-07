sub error1()
    a = 10 ' error
end sub

sub error2()
    a = 10
    print a
    a = 20 ' error
end sub

sub ok1(usageNotChecked)
    a = 10
    print a
    b = 20
    Rnd(b)
end sub

sub ok2()
    m = {}
    for i = 0 to 10
        print "hello"
    end for
end sub

sub ok3()
    a = 8
    if a > 5
        if true then a = 20
        print a
    end if
end sub
